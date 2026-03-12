import { Global, Module } from '@nestjs/common'

import { RedisPubSubService } from './redis-pubsub.service.js'

/**
 * RedisPubSubModule
 *
 * Global module — import once in AppModule.
 * Provides `RedisPubSubService` for fan-out messaging across app instances.
 */
@Global()
@Module({
  providers: [RedisPubSubService],
  exports: [RedisPubSubService],
})
export class RedisPubSubModule {}
