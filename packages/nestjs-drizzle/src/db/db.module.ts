import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { DB_TOKEN } from './db.port.js'
import { createDrizzleInstance } from './db.provider.js'

import type { DrizzleAsyncOptions } from './db.port.js'
import type { DynamicModule } from '@nestjs/common'

/**
 * Drizzle database module
 *
 * Uses Dynamic Module pattern, similar to @nestjs/typeorm
 * - forRoot(): Uses default ConfigService configuration
 * - forRootAsync(): Uses custom factory function configuration
 */
@Global()
@Module({})
export class DrizzleModule {
  /**
   * Create global database connection using default ConfigService
   * Should be called once in AppModule
   */
  static forRoot(): DynamicModule {
    return {
      module: DrizzleModule,
      providers: [
        {
          provide: DB_TOKEN,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return createDrizzleInstance({
              connectionString: configService.getOrThrow<string>('DATABASE_URL'),
              pool: {
                max: configService.get<number>('DB_POOL_MAX'),
                min: configService.get<number>('DB_POOL_MIN'),
                idleTimeoutMillis: configService.get<number>('DB_POOL_IDLE_TIMEOUT'),
                connectionTimeoutMillis: configService.get<number>('DB_POOL_CONNECTION_TIMEOUT'),
              },
            })
          },
        },
      ],
      exports: [DB_TOKEN],
    }
  }

  /**
   * Create global database connection using custom factory function
   * Suitable for scenarios requiring more flexible configuration
   *
   * @example
   * DrizzleModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (config: ConfigService) => ({
   *     connectionString: config.get('DATABASE_URL'),
   *     pool: { max: 20 },
   *   }),
   * })
   */
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
