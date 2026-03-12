import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { buildRedisUrl, createRedisClient } from '@workspace/nestjs-redis'

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { RedisClientType } from '@workspace/nestjs-redis'

type PatternHandler = (message: string, channel: string) => void

/**
 * RedisPubSubService
 *
 * General-purpose Redis pub/sub backed by a dedicated publisher + subscriber
 * client pair. Designed for fan-out messaging across multiple app instances.
 *
 * Features:
 * - Best-effort connect: stays in no-op mode when Redis is unavailable.
 * - `publish` / `publishJson` for sending messages.
 * - `pSubscribe` for glob-pattern subscriptions.
 */
@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name)
  private readonly publisher: RedisClientType
  private readonly subscriber: RedisClientType
  private isReady = false

  constructor(config: ConfigService) {
    const url = buildRedisUrl(config)
    this.publisher = createRedisClient(url)
    this.subscriber = (this.publisher.duplicate() as RedisClientType) ?? createRedisClient(url)
  }

  /**
   * Best-effort connect. If Redis is unavailable, the service stays disabled (no-ops).
   */
  async init(): Promise<void> {
    if (this.isReady) return
    try {
      await Promise.all([this.publisher.connect(), this.subscriber.connect()])
      this.isReady = true
      this.logger.log('Redis pub/sub connected')
    } catch (error) {
      this.isReady = false
      this.logger.warn('Redis pub/sub unavailable; falling back to in-memory only', { error })
    }
  }

  close(): void {
    try {
      if (this.publisher.isOpen) this.publisher.destroy()
      if (this.subscriber.isOpen) this.subscriber.destroy()
    } finally {
      this.isReady = false
    }
  }

  async onModuleInit(): Promise<void> {
    await this.init()
  }

  onModuleDestroy(): void {
    this.close()
  }

  get ready(): boolean {
    return this.isReady
  }

  async publish(channel: string, message: string): Promise<boolean> {
    if (!this.isReady) return false
    try {
      await this.publisher.publish(channel, message)
      return true
    } catch (error) {
      this.logger.warn(`Redis publish failed for channel ${channel}`, { error })
      return false
    }
  }

  async publishJson(channel: string, payload: unknown): Promise<boolean> {
    return this.publish(channel, JSON.stringify(payload))
  }

  /**
   * Pattern subscription (glob). Handler receives (message, channel).
   */
  async pSubscribe(pattern: string, handler: PatternHandler): Promise<boolean> {
    if (!this.isReady) return false
    try {
      await this.subscriber.pSubscribe(pattern, (message, channel) => {
        handler(String(message), String(channel))
      })
      return true
    } catch (error) {
      this.logger.warn(`Redis pSubscribe failed for pattern ${pattern}`, { error })
      return false
    }
  }
}
