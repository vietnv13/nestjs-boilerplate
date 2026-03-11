import { Global, Module } from '@nestjs/common'

import { RedisPubSubService } from './redis-pubsub.service.js'

@Global()
@Module({
  providers: [RedisPubSubService],
  exports: [RedisPubSubService],
})
export class RedisPubSubModule {}
