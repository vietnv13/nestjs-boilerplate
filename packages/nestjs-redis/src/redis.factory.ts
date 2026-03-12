import { createClient } from '@redis/client'

import type { ConfigService } from '@nestjs/config'
import type { RedisClientType } from '@redis/client'

/**
 * Build a Redis connection URL from `ConfigService`.
 *
 * Reads `REDIS_HOST` (required), `REDIS_PORT` (default 6379), and
 * `REDIS_PASSWORD` (optional) from the environment.
 *
 * @example
 * ```ts
 * const url = buildRedisUrl(configService)
 * // → 'redis://localhost:6379'
 * // → 'redis://:secret@redis.internal:6380'
 * ```
 */
export function buildRedisUrl(config: ConfigService): string {
  const host = config.getOrThrow<string>('REDIS_HOST')
  const port = config.get<number>('REDIS_PORT') ?? 6379
  const password = config.get<string>('REDIS_PASSWORD')

  return password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`
}

/**
 * Create a `@redis/client` instance from a pre-built URL.
 * The caller is responsible for connecting and destroying the client.
 */
export function createRedisClient(url: string): RedisClientType {
  return createClient({ url }) as RedisClientType
}

/**
 * Convenience: create a Redis client directly from `ConfigService`.
 * Equivalent to `createRedisClient(buildRedisUrl(config))`.
 */
export function createRedisClientFromConfig(config: ConfigService): RedisClientType {
  return createRedisClient(buildRedisUrl(config))
}
