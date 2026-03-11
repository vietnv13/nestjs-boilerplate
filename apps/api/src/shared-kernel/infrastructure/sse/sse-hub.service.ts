import { randomUUID } from 'node:crypto'

import { Injectable, Logger } from '@nestjs/common'
import { Subject } from 'rxjs'
import { finalize } from 'rxjs/operators'

import { RedisPubSubService } from '@/shared-kernel/infrastructure/pubsub/redis-pubsub.service'
import { SSE_REDIS_CHANNEL_PREFIX } from '@/shared-kernel/infrastructure/sse/sse.constants'

import type { MessageEvent, OnModuleInit } from '@nestjs/common'
import type { Observable } from 'rxjs'

export type SseChannelKey = string

/**
 * In-memory SSE hub (pub/sub) for pushing events to connected clients.
 *
 * Notes:
 * - This is per-process. In production with multiple instances, pair with a
 *   distributed transport (Redis/NATS/Kafka) and publish from there.
 * - Subscribers are auto-removed on disconnect (Observable finalize).
 */
@Injectable()
export class SseHubService implements OnModuleInit {
  private readonly logger = new Logger(SseHubService.name)
  private readonly instanceId = randomUUID()
  private readonly channels = new Map<SseChannelKey, Set<Subject<MessageEvent>>>()

  constructor(private readonly redisPubSub: RedisPubSubService) {}

  async onModuleInit(): Promise<void> {
    await this.redisPubSub.init()
    if (!this.redisPubSub.ready) return

    await this.redisPubSub.pSubscribe(`${SSE_REDIS_CHANNEL_PREFIX}*`, (message, redisChannel) => {
      const channel = redisChannel.startsWith(SSE_REDIS_CHANNEL_PREFIX)
        ? redisChannel.slice(SSE_REDIS_CHANNEL_PREFIX.length)
        : redisChannel

      try {
        const payload = JSON.parse(message) as { origin?: string; event?: MessageEvent }
        if (payload.origin && payload.origin === this.instanceId) {
          return
        }
        if (!payload.event) return

        this.publishLocal(channel, payload.event)
      } catch (error) {
        this.logger.warn(`Failed to parse SSE redis message for channel ${redisChannel}`, { error })
      }
    })
  }

  subscribe(channel: SseChannelKey): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>()
    const subscribers = this.channels.get(channel) ?? new Set<Subject<MessageEvent>>()
    subscribers.add(subject)
    this.channels.set(channel, subscribers)

    return subject.asObservable().pipe(
      finalize(() => {
        const set = this.channels.get(channel)
        if (!set) return
        set.delete(subject)
        if (set.size === 0) this.channels.delete(channel)
      }),
    )
  }

  async publish(
    channel: SseChannelKey,
    event: MessageEvent,
  ): Promise<{ transport: 'redis' | 'memory'; delivered: number }> {
    const delivered = this.publishLocal(channel, event)

    if (this.redisPubSub.ready) {
      const ok = await this.redisPubSub.publishJson(`${SSE_REDIS_CHANNEL_PREFIX}${channel}`, {
        origin: this.instanceId,
        event,
      })
      if (ok) return { transport: 'redis', delivered }
    }

    return { transport: 'memory', delivered }
  }

  private publishLocal(channel: SseChannelKey, event: MessageEvent): number {
    const subscribers = this.channels.get(channel)
    if (!subscribers || subscribers.size === 0) return 0

    let delivered = 0
    for (const subject of subscribers) {
      subject.next(event)
      delivered += 1
    }
    return delivered
  }
}
