import { Global, Module } from '@nestjs/common'

import { RedisPubSubModule } from '@workspace/nestjs-pubsub'
import { SseHubService } from './sse-hub.service.js'

@Global()
@Module({
  imports: [RedisPubSubModule],
  providers: [SseHubService],
  exports: [SseHubService],
})
export class SseModule {}
