import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { BULL_QUEUE_NAME, RedisQueueDriver, RedisQueueWorker } from './drivers/redis.driver.js'
import { SyncQueueDriver } from './drivers/sync.driver.js'
import { QueueJobRepository } from './queue-job.repository.js'
import { QUEUE_DRIVER } from './queue.port.js'
import { QueueRegistry } from './queue.registry.js'
import { QueueService } from './queue.service.js'

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
    const driver = (process.env['QUEUE_DRIVER'] ?? 'sync').toLowerCase()
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
          useFactory: (config: ConfigService) => ({
            connection: {
              host: config.getOrThrow<string>('REDIS_HOST'),
              port: config.get<number>('REDIS_PORT') ?? 6379,
              password: config.get<string>('REDIS_PASSWORD'),
            },
          }),
        }),
        BullModule.registerQueueAsync({
          name: BULL_QUEUE_NAME,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            name: config.get<string>('QUEUE_NAME') ?? 'default',
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
