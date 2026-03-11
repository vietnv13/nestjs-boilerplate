import { Global, Module } from '@nestjs/common'

import { RedisPubSubModule } from '@/shared-kernel/infrastructure/pubsub/redis-pubsub.module'
import { SseHubService } from '@/shared-kernel/infrastructure/sse/sse-hub.service'

@Global()
@Module({
  imports: [RedisPubSubModule],
  providers: [SseHubService],
  exports: [SseHubService],
})
export class SseModule {}
