import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { BULL_QUEUE_NAME, RedisQueueDriver, RedisQueueWorker } from './drivers/redis.driver'
import { SyncQueueDriver } from './drivers/sync.driver'
import { QueueJobRepository } from './queue-job.repository'
import { QUEUE_DRIVER } from './queue.port'
import { QueueRegistry } from './queue.registry'
import { QueueService } from './queue.service'

import type { Env } from '@/app/config/env.schema'
import type { DynamicModule } from '@nestjs/common'

/**
 * QueueModule
 *
 * Global infrastructure module that wires up the queue system.
 * The active driver is selected by the `QUEUE_DRIVER` environment variable:
 *
 *   QUEUE_DRIVER=sync   → in-process synchronous execution (default)
 *   QUEUE_DRIVER=redis  → BullMQ + Redis (production recommended)
 *
 * Import once in AppModule via `QueueModule.register()`.
 * Every other module gets `QueueService` and `QueueRegistry` injected
 * automatically because the module is marked `@Global()`.
 */
@Global()
@Module({})
export class QueueModule {
  static register(): DynamicModule {
    const driver = (process.env.QUEUE_DRIVER ?? 'sync').toLowerCase()
    const isRedis = driver === 'redis'

    if (!isRedis) {
      return {
        module: QueueModule,
        providers: [
          QueueRegistry,
          QueueJobRepository,
          SyncQueueDriver,
          { provide: QUEUE_DRIVER, useClass: SyncQueueDriver },
          QueueService,
        ],
        exports: [QueueService, QueueRegistry],
      }
    }

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService<Env, true>) => ({
            connection: {
              host: config.get('REDIS_HOST', { infer: true }),
              port: config.get('REDIS_PORT', { infer: true }),
              password: config.get('REDIS_PASSWORD', { infer: true }),
            },
          }),
        }),
        BullModule.registerQueueAsync({
          name: BULL_QUEUE_NAME,
          inject: [ConfigService],
          useFactory: (config: ConfigService<Env, true>) => ({
            name: config.get('QUEUE_NAME', { infer: true }),
          }),
        }),
      ],
      providers: [
        QueueRegistry,
        QueueJobRepository,
        RedisQueueDriver,
        {
          provide: QUEUE_DRIVER,
          useClass: RedisQueueDriver,
        },
        {
          provide: RedisQueueWorker,
          useClass: RedisQueueWorker,
        },
        QueueService,
      ],
      exports: [QueueService, QueueRegistry],
    }
  }
}
