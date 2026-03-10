import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

import type { BaseAggregateRoot } from "@/shared-kernel/domain/base-aggregate-root";
import type { BaseDomainEvent } from "@/shared-kernel/domain/base-domain-event";

/**
 * Domain event publisher
 *
 * Collects events from aggregates and publishes to the event bus.
 * Inject this into application services or command handlers to dispatch
 * domain events after mutating aggregate state.
 */
@Injectable()
export class DomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publish all pending domain events from an aggregate, then clear the queue
   */
  async publishEventsForAggregate(aggregate: BaseAggregateRoot): Promise<void> {
    const events = aggregate.getDomainEvents();

    for (const event of events) {
      await this.publish(event);
    }

    aggregate.clearDomainEvents();
  }

  /**
   * Publish a single domain event
   */
  async publish(event: BaseDomainEvent): Promise<void> {
    const { eventType, aggregateId } = event.getMetadata();

    this.logger.debug(`Publishing domain event: ${eventType}`, { aggregateId });

    await this.eventEmitter.emitAsync(eventType, event);
  }
}
