import { Global, Module } from '@nestjs/common'

import { RedisPubSubService } from '@/shared-kernel/infrastructure/pubsub/redis-pubsub.service'

@Global()
@Module({
  providers: [RedisPubSubService],
  exports: [RedisPubSubService],
})
export class RedisPubSubModule {}
