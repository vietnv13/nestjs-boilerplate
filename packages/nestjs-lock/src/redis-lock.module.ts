import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { buildRedisUrl, createRedisClient } from '@workspace/nestjs-redis'

import { REDIS_LOCK_CLIENT } from './redis-lock.constants.js'
import { RedisLockService } from './redis-lock.service.js'

import type { RedisClientType } from '@workspace/nestjs-redis'

/**
 * RedisLockModule
 *
 * Provides a dedicated Redis client for atomic SET NX locks, separate from cache-manager.
 * This module is global so locks can be reused by any feature (scheduler, sagas, etc).
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_LOCK_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): RedisClientType =>
        createRedisClient(buildRedisUrl(config)),
    },
    RedisLockService,
  ],
  exports: [RedisLockService],
})
export class RedisLockModule {}
