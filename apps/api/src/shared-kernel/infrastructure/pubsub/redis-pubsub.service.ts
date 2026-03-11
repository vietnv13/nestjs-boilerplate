import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@redis/client'

import type { Env } from '@/app/config/env.schema'
import type { RedisClientType } from '@redis/client'
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'

type PatternHandler = (message: string, channel: string) => void

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name)
  private readonly publisher: RedisClientType
  private readonly subscriber: RedisClientType
  private isReady = false

  constructor(config: ConfigService<Env, true>) {
    const host = config.get('REDIS_HOST', { infer: true })
    const port = config.get('REDIS_PORT', { infer: true })
    const password = config.get('REDIS_PASSWORD', { infer: true })
    const url = password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`

    this.publisher = createClient({ url }) as RedisClientType
    this.subscriber =
      (this.publisher.duplicate() as RedisClientType) ?? (createClient({ url }) as RedisClientType)
  }

  /**
   * Best-effort connect. If Redis is unavailable, this service stays disabled (no-ops).
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

  async close(): Promise<void> {
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

  async onModuleDestroy(): Promise<void> {
    await this.close()
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
   * Pattern subscription (glob). Handler is called with (message, channel).
   */
  async pSubscribe(pattern: string, handler: PatternHandler): Promise<boolean> {
    if (!this.isReady) return false
    try {
      // @redis/client supports pSubscribe(pattern, listener)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.subscriber as any).pSubscribe(pattern, (message: string, channel: string) => {
        handler(message, channel)
      })
      return true
    } catch (error) {
      this.logger.warn(`Redis pSubscribe failed for pattern ${pattern}`, { error })
      return false
    }
  }
}
