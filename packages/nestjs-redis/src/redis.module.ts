import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { createRedisClientFromConfig } from './redis.factory.js'
import { RedisService } from './redis.service.js'
import { REDIS_CLIENT } from './redis.token.js'

import type { RedisAsyncOptions } from './redis.types.js'
import type { DynamicModule } from '@nestjs/common'

/**
 * RedisModule
 *
 * Global module that provisions a shared Redis client (`REDIS_CLIENT`) and
 * `RedisService`. Import once in `AppModule`.
 *
 * ## `forRoot()` — reads from `ConfigService` (recommended)
 *
 * ```ts
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true }),
 *     RedisModule.forRoot(),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * ## `forRootAsync()` — custom factory
 *
 * ```ts
 * RedisModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     url: buildRedisUrl(config),
 *   }),
 * })
 * ```
 */
@Global()
@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_CLIENT,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => createRedisClientFromConfig(config),
        },
        RedisService,
      ],
      exports: [REDIS_CLIENT, RedisService],
    }
  }

  static forRootAsync(options: RedisAsyncOptions): DynamicModule {
    return {
      module: RedisModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: REDIS_CLIENT,
          inject: options.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const { url } = await options.useFactory(...args)
            const { createRedisClient } = await import('./redis.factory.js')
            return createRedisClient(url)
          },
        },
        RedisService,
      ],
      exports: [REDIS_CLIENT, RedisService],
    }
  }
}
