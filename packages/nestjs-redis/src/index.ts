// Token + client type
export { REDIS_CLIENT } from './redis.token.js'
export type { RedisClientType } from './redis.token.js'

// Configuration types
export type { RedisAsyncOptions, RedisModuleOptions } from './redis.types.js'

// Factory utilities (useful for packages that need their own dedicated client)
export { buildRedisUrl, createRedisClient, createRedisClientFromConfig } from './redis.factory.js'

// NestJS module + service
export { RedisModule } from './redis.module.js'
export { RedisService } from './redis.service.js'
