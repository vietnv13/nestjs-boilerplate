import KeyvRedis from '@keyv/redis'
import { CacheModule as NestCacheModule, type CacheModuleOptions } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { CacheService } from './cache.service.js'

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
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        const host = configService.get<string>('REDIS_HOST')
        const ttl = (configService.get<number>('REDIS_TTL') ?? 60) * 1000 // ms

        // If Redis isn't configured, fall back to in-memory cache-manager store.
        if (!host) {
          return { ttl, namespace: 'api' }
        }

        const port = configService.get<number>('REDIS_PORT') ?? 6379
        const password = configService.get<string>('REDIS_PASSWORD')

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
