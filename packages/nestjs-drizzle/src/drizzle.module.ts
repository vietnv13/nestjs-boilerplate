import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { createDrizzleInstance } from './drizzle.factory.js'
import { DB_TOKEN } from './drizzle.token.js'

import type { DrizzleAsyncOptions } from './drizzle.types.js'
import type { DynamicModule } from '@nestjs/common'

/**
 * DrizzleModule
 *
 * Global NestJS module that creates a single Drizzle ORM instance and exposes
 * it via `DB_TOKEN`. Import it **once** in `AppModule`.
 *
 * Two registration modes are supported:
 *
 * ## `forRoot()` — uses `ConfigService` (recommended)
 *
 * Reads `DATABASE_URL`, `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_IDLE_TIMEOUT`,
 * and `DB_POOL_CONNECTION_TIMEOUT` automatically from the environment.
 *
 * ```ts
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot({ isGlobal: true }),
 *     DrizzleModule.forRoot(),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * ## `forRootAsync()` — custom factory
 *
 * Use when you need to derive options from non-ConfigService sources.
 *
 * ```ts
 * DrizzleModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     connectionString: config.getOrThrow('DATABASE_URL'),
 *     pool: { max: 20 },
 *   }),
 * })
 * ```
 */
@Global()
@Module({})
export class DrizzleModule {
  static forRoot(): DynamicModule {
    return {
      module: DrizzleModule,
      providers: [
        {
          provide: DB_TOKEN,
          inject: [ConfigService],
          useFactory: (config: ConfigService) =>
            createDrizzleInstance({
              connectionString: config.getOrThrow<string>('DATABASE_URL'),
              pool: {
                max: config.get<number>('DB_POOL_MAX'),
                min: config.get<number>('DB_POOL_MIN'),
                idleTimeoutMillis: config.get<number>('DB_POOL_IDLE_TIMEOUT'),
                connectionTimeoutMillis: config.get<number>('DB_POOL_CONNECTION_TIMEOUT'),
              },
            }),
        },
      ],
      exports: [DB_TOKEN],
    }
  }

  static forRootAsync(options: DrizzleAsyncOptions): DynamicModule {
    return {
      module: DrizzleModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: DB_TOKEN,
          inject: options.inject ?? [],
          useFactory: async (...args: unknown[]) => {
            const moduleOptions = await options.useFactory(...args)
            return createDrizzleInstance(moduleOptions)
          },
        },
      ],
      exports: [DB_TOKEN],
    }
  }
}
