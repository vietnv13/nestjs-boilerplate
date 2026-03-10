import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { EventStorePublisher } from './event-store/event-store.publisher'
import { EventStoreService } from './event-store/event-store.service'

/**
 * Events Module
 *
 * Provides shared event-sourcing infrastructure:
 * - EventStoreService: in-memory event store (swap for persistent backend in production)
 * - EventStorePublisher: subscribes to EventBus and persists every event
 *
 * Module-specific sagas live in their own bounded context:
 * - TodoCompletionSaga → modules/todo/application/sagas/
 * - UserRegistrationSaga → modules/user/application/sagas/
 */
@Module({
  imports: [CqrsModule],
  providers: [EventStoreService, EventStorePublisher],
  exports: [EventStoreService],
})
export class EventsModule {}
