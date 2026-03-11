import { Global, Module } from '@nestjs/common'

import { RedisPubSubModule } from '../pubsub/redis-pubsub.module.js'
import { SseHubService } from './sse-hub.service.js'

@Global()
@Module({
  imports: [RedisPubSubModule],
  providers: [SseHubService],
  exports: [SseHubService],
})
export class SseModule {}
