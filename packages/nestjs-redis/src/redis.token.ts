import type { RedisClientType } from '@redis/client'

/**
 * DI injection token for the shared Redis client provided by `RedisModule`.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class MyService {
 *   constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}
 * }
 * ```
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

/** Re-export the fully-typed Redis client type for convenience. */
export type { RedisClientType }
