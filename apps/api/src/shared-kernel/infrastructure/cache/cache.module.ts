import KeyvRedis from '@keyv/redis'
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { CacheService } from './cache.service'

import type { Env } from '@/app/config/env.schema'

/**
 * Cache module
 *
 * Provides a global caching layer using @nestjs/cache-manager.
 * Uses Redis when REDIS_HOST is configured, falls back to in-memory.
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => {
        const host = configService.get('REDIS_HOST', { infer: true })
        const port = configService.get('REDIS_PORT', { infer: true })
        const password = configService.get('REDIS_PASSWORD', { infer: true })
        const ttl = configService.get('REDIS_TTL', { infer: true }) * 1000 // ms

        const redisUrl = password
          ? `redis://:${password}@${host}:${port}`
          : `redis://${host}:${port}`

        // Pass the adapter (not a Keyv instance) so @nestjs/cache-manager can wrap it correctly.
        // This avoids `instanceof Keyv` mismatches between ESM/CJS entrypoints that can lead to
        // Keyv being constructed with a Keyv instance as its "store" (and crashing on opts.url).
        const store = new KeyvRedis(redisUrl)

        return { stores: [store], ttl, namespace: 'api' }
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
