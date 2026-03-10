import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { UserRegistrationSaga } from "./sagas/user-registration.saga";
import { TodoCompletionSaga } from "./sagas/todo-completion.saga";
import { EventStoreService } from "./event-store/event-store.service";
import { EventStorePublisher } from "./event-store/event-store.publisher";

const Sagas = [UserRegistrationSaga, TodoCompletionSaga];

/**
 * Events Module
 *
 * Provides domain event infrastructure:
 * - Sagas for complex workflows
 * - Event store for event sourcing
 * - Event replay capabilities
 */
@Module({
  imports: [CqrsModule],
  providers: [...Sagas, EventStoreService, EventStorePublisher],
  exports: [EventStoreService],
})
export class EventsModule {}
