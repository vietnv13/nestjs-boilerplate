import { randomUUID } from 'node:crypto'

import { Inject, Injectable, Logger } from '@nestjs/common'

import { REDIS_LOCK_CLIENT } from './redis-lock.constants'

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { RedisClientType } from '@redis/client'

/** Lua script: delete a key only if its value matches (atomic compare-and-delete) */
const RELEASE_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`

/**
 * RedisLockService
 *
 * Atomic distributed locking using Redis `SET key value NX EX ttl`.
 *
 * Locking flow:
 * 1. `acquire()` → SET NX returns 'OK' only if the key did not exist.
 * 2. The caller runs the critical section.
 * 3. `release()` → Lua script deletes the key only if the stored value matches our token.
 */
@Injectable()
export class RedisLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name)

  constructor(
    @Inject(REDIS_LOCK_CLIENT)
    private readonly client: RedisClientType,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect()
    this.logger.log('Redis lock client connected')
  }

  onModuleDestroy(): void {
    this.client.destroy()
  }

  /**
   * Try to acquire a lock for a given key.
   *
   * @returns The `lockToken` (a UUID) if acquired, or `null` if another instance holds the lock.
   */
  async acquire(key: string, ttlMs: number): Promise<string | null> {
    const token = randomUUID()
    const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000))

    const result = await this.client.set(key, token, {
      NX: true,
      EX: ttlSec,
    })

    return result === 'OK' ? token : null
  }

  /**
   * Release a lock only if `lockToken` matches what is stored in Redis.
   * Safe to call even if the lock has already expired.
   */
  async release(key: string, lockToken: string): Promise<void> {
    try {
      await this.client.eval(RELEASE_SCRIPT, {
        keys: [key],
        arguments: [lockToken],
      })
    } catch (error) {
      this.logger.warn(`Failed to release lock for key ${key} — will expire naturally`, { error })
    }
  }
}
