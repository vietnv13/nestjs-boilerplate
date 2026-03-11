import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@redis/client'

import { REDIS_LOCK_CLIENT } from './redis-lock.constants.js'
import { RedisLockService } from './redis-lock.service.js'

import type { RedisClientType } from '@redis/client'

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
      useFactory: (config: ConfigService): RedisClientType => {
        const host = config.getOrThrow<string>('REDIS_HOST')
        const port = config.get<number>('REDIS_PORT') ?? 6379
        const password = config.get<string>('REDIS_PASSWORD')

        const url = password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`
        return createClient({ url }) as RedisClientType
      },
    },
    RedisLockService,
  ],
  exports: [RedisLockService],
})
export class RedisLockModule {}
