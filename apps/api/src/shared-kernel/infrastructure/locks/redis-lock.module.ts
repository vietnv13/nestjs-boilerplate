import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from '@redis/client'

import { REDIS_LOCK_CLIENT } from './redis-lock.constants'
import { RedisLockService } from './redis-lock.service'

import type { Env } from '@/app/config/env.schema'
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
      useFactory: (config: ConfigService<Env, true>): RedisClientType => {
        const host = config.get('REDIS_HOST', { infer: true })
        const port = config.get('REDIS_PORT', { infer: true })
        const password = config.get('REDIS_PASSWORD', { infer: true })

        const url = password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`
        return createClient({ url }) as RedisClientType
      },
    },
    RedisLockService,
  ],
  exports: [RedisLockService],
})
export class RedisLockModule {}
