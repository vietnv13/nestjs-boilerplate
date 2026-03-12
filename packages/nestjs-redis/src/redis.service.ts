import { Inject, Injectable, Logger } from '@nestjs/common'

import { REDIS_CLIENT } from './redis.token.js'

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { RedisClientType } from '@redis/client'

/**
 * RedisService
 *
 * Injectable wrapper around a `@redis/client` instance.
 * Covers the most common Redis data structures and patterns.
 *
 * Injected via `RedisModule` — you never need to touch the raw client.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class UserCacheService {
 *   constructor(private readonly redis: RedisService) {}
 *
 *   async cacheUser(id: string, user: User): Promise<void> {
 *     await this.redis.setJson(`user:${id}`, user, 3600_000)
 *   }
 *
 *   async getUser(id: string): Promise<User | null> {
 *     return this.redis.getJson<User>(`user:${id}`)
 *   }
 * }
 * ```
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)

  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClientType) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect()
    this.logger.log('Redis client connected')
  }

  onModuleDestroy(): void {
    this.client.destroy()
  }

  // ─── Health ───────────────────────────────────────────────────────────────

  /** Returns true if the client is connected and ready. */
  get isReady(): boolean {
    return this.client.isReady
  }

  /** Send a PING command. Returns 'PONG' on success. */
  async ping(): Promise<string> {
    return this.client.ping()
  }

  // ─── Strings ──────────────────────────────────────────────────────────────

  /** GET key → string or null. */
  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  /**
   * SET key value [PX ttlMs].
   * @param ttlMs Optional time-to-live in milliseconds.
   */
  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    await (ttlMs && ttlMs > 0
      ? this.client.set(key, value, { PX: ttlMs })
      : this.client.set(key, value))
  }

  /**
   * SET key value NX [PX ttlMs] — only sets if key does NOT exist.
   * @returns true if the key was set, false if it already existed.
   */
  async setNx(key: string, value: string, ttlMs?: number): Promise<boolean> {
    const result = ttlMs
      ? await this.client.set(key, value, { NX: true, PX: ttlMs })
      : await this.client.set(key, value, { NX: true })
    return result === 'OK'
  }

  /** DEL one or more keys. Returns the number of keys deleted. */
  async del(...keys: string[]): Promise<number> {
    return this.client.del(keys)
  }

  /** EXISTS key. Returns true if the key exists. */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) > 0
  }

  /**
   * PEXPIRE key ttlMs — set a TTL on an existing key.
   * @param ttlMs TTL in milliseconds.
   * @returns true if the timeout was set, false if the key does not exist.
   */
  async expire(key: string, ttlMs: number): Promise<boolean> {
    return (await this.client.pExpire(key, ttlMs)) > 0
  }

  /** PTTL key — remaining TTL in milliseconds. -1 = no TTL, -2 = key not found. */
  async ttl(key: string): Promise<number> {
    return this.client.pTTL(key)
  }

  /** INCR key — atomic increment by 1. Returns the new value. */
  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  /** INCRBY key amount. Returns the new value. */
  async incrBy(key: string, amount: number): Promise<number> {
    return this.client.incrBy(key, amount)
  }

  /** DECR key — atomic decrement by 1. Returns the new value. */
  async decr(key: string): Promise<number> {
    return this.client.decr(key)
  }

  // ─── JSON helpers ─────────────────────────────────────────────────────────

  /**
   * GET key and parse as JSON.
   * @returns Parsed value or null if the key does not exist.
   */
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  }

  /**
   * SET key JSON.stringify(value) [PX ttlMs].
   */
  async setJson(key: string, value: unknown, ttlMs?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlMs)
  }

  // ─── Hashes ───────────────────────────────────────────────────────────────

  /** HGET key field → string or null. */
  async hGet(key: string, field: string): Promise<string | null> {
    return (await this.client.hGet(key, field)) ?? null
  }

  /** HSET key field value. */
  async hSet(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value)
  }

  /** HMSET key {field: value, ...}. */
  async hMSet(key: string, data: Record<string, string>): Promise<void> {
    await this.client.hSet(key, data)
  }

  /** HGETALL key → Record<string, string> or empty object if key not found. */
  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key)
  }

  /** HDEL key field [...fields]. Returns number of fields deleted. */
  async hDel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hDel(key, fields)
  }

  /** HEXISTS key field. */
  async hExists(key: string, field: string): Promise<boolean> {
    return (await this.client.hExists(key, field)) === 1
  }

  /** HLEN key — number of fields in hash. */
  async hLen(key: string): Promise<number> {
    return this.client.hLen(key)
  }

  // ─── Lists ────────────────────────────────────────────────────────────────

  /** LPUSH key value [...values]. Returns new list length. */
  async lPush(key: string, ...values: string[]): Promise<number> {
    return this.client.lPush(key, values)
  }

  /** RPUSH key value [...values]. Returns new list length. */
  async rPush(key: string, ...values: string[]): Promise<number> {
    return this.client.rPush(key, values)
  }

  /** LPOP key. Returns the removed element or null. */
  async lPop(key: string): Promise<string | null> {
    return this.client.lPop(key)
  }

  /** RPOP key. Returns the removed element or null. */
  async rPop(key: string): Promise<string | null> {
    return this.client.rPop(key)
  }

  /** LLEN key — number of elements in list. */
  async lLen(key: string): Promise<number> {
    return this.client.lLen(key)
  }

  /** LRANGE key start stop — returns a slice of the list. */
  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lRange(key, start, stop)
  }

  // ─── Sets ─────────────────────────────────────────────────────────────────

  /** SADD key member [...members]. Returns number of new members added. */
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.client.sAdd(key, members)
  }

  /** SREM key member [...members]. Returns number of members removed. */
  async sRem(key: string, ...members: string[]): Promise<number> {
    return this.client.sRem(key, members)
  }

  /** SMEMBERS key — all members of the set. */
  async sMembers(key: string): Promise<string[]> {
    return this.client.sMembers(key)
  }

  /** SISMEMBER key member. */
  async sIsMember(key: string, member: string): Promise<boolean> {
    return (await this.client.sIsMember(key, member)) === 1
  }

  /** SCARD key — number of members in set. */
  async sCard(key: string): Promise<number> {
    return this.client.sCard(key)
  }

  // ─── Key scanning ─────────────────────────────────────────────────────────

  /**
   * KEYS pattern — returns all matching keys.
   * Avoid in production on large keyspaces; use `scan()` instead.
   */
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }

  /**
   * SCAN cursor [MATCH pattern] [COUNT count] — cursor-based key iteration.
   * Returns `{ cursor: 0, keys }` when the full scan is complete.
   *
   * @example
   * ```ts
   * let cursor = 0
   * do {
   *   const result = await redis.scan(cursor, 'session:*', 100)
   *   // process result.keys...
   *   cursor = result.cursor
   * } while (cursor !== 0)
   * ```
   */
  async scan(
    cursor: number,
    match?: string,
    count?: number,
  ): Promise<{ cursor: number; keys: string[] }> {
    const result = await this.client.scan(String(cursor), {
      MATCH: match,
      COUNT: count,
    })
    return { cursor: Number(result.cursor), keys: result.keys }
  }

  // ─── Scripting ────────────────────────────────────────────────────────────

  /**
   * EVAL script — execute a Lua script atomically.
   *
   * @example
   * ```ts
   * const script = `
   *   if redis.call("GET", KEYS[1]) == ARGV[1] then
   *     return redis.call("DEL", KEYS[1])
   *   end
   *   return 0
   * `
   * await redis.eval(script, ['my-lock-key'], ['my-token'])
   * ```
   */
  async eval(script: string, keys: string[], args: string[]): Promise<unknown> {
    return this.client.eval(script, { keys, arguments: args })
  }

  // ─── Raw client access ────────────────────────────────────────────────────

  /**
   * Escape hatch: returns the raw `@redis/client` instance.
   * Use only when `RedisService` doesn't cover your use case.
   */
  getClient(): RedisClientType {
    return this.client
  }
}
