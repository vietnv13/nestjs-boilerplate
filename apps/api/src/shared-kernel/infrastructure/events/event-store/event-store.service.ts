import { Injectable, Logger } from "@nestjs/common";
import type { IEvent } from "@nestjs/cqrs";
import type { StoredEvent, EventFilter } from "./event-store.types";

/**
 * Event Store Service
 *
 * Provides in-memory event sourcing capabilities: store, retrieve, and replay
 * domain events. Suitable for development and testing.
 *
 * For production, replace the in-memory store with a persistent backend
 * (e.g., EventStoreDB, PostgreSQL with JSONB, or DynamoDB).
 */
@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  private events: StoredEvent[] = [];
  private eventVersion = 0;

  async store(event: IEvent, aggregateId: string, userId?: string): Promise<StoredEvent> {
    const storedEvent: StoredEvent = {
      id: crypto.randomUUID(),
      aggregateId,
      eventType: event.constructor.name,
      eventData: event,
      metadata: {
        timestamp: new Date(),
        version: ++this.eventVersion,
        userId,
      },
      createdAt: new Date(),
    };

    this.events.push(storedEvent);
    this.logger.debug(`Stored event: ${storedEvent.eventType}`, {
      aggregateId,
      version: storedEvent.metadata.version,
    });

    return storedEvent;
  }

  async getEventsForAggregate(aggregateId: string): Promise<StoredEvent[]> {
    return this.events.filter((e) => e.aggregateId === aggregateId);
  }

  async getEvents(filter: EventFilter = {}): Promise<StoredEvent[]> {
    let filtered = [...this.events];

    if (filter.aggregateId) filtered = filtered.filter((e) => e.aggregateId === filter.aggregateId);
    if (filter.eventType) filtered = filtered.filter((e) => e.eventType === filter.eventType);
    if (filter.fromDate) filtered = filtered.filter((e) => e.createdAt >= filter.fromDate!);
    if (filter.toDate) filtered = filtered.filter((e) => e.createdAt <= filter.toDate!);
    if (filter.limit) filtered = filtered.slice(0, filter.limit);

    return filtered;
  }

  async replayEvents(aggregateId: string): Promise<IEvent[]> {
    const events = await this.getEventsForAggregate(aggregateId);
    this.logger.debug(`Replaying ${events.length} events for aggregate ${aggregateId}`);
    return events.map((e) => e.eventData);
  }

  async getEventCount(filter: EventFilter = {}): Promise<number> {
    return (await this.getEvents(filter)).length;
  }

  /** Clear all events — intended for testing only */
  async clear(): Promise<void> {
    this.events = [];
    this.eventVersion = 0;
    this.logger.debug("Cleared all events");
  }
}
