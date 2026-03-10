import { Injectable } from "@nestjs/common";
import type { IEvent } from "@nestjs/cqrs";
import type { StoredEvent, EventFilter } from "./event-store.types";

/**
 * Event Store Service
 *
 * Provides event sourcing capabilities:
 * - Store all domain events
 * - Retrieve event history
 * - Replay events for debugging or rebuilding state
 *
 * In production, this would use a dedicated event store database
 * (e.g., EventStoreDB, PostgreSQL with JSONB, or DynamoDB)
 */
@Injectable()
export class EventStoreService {
  // In-memory storage for demonstration
  // In production, use a persistent database
  private events: StoredEvent[] = [];
  private eventVersion = 0;

  /**
   * Store a domain event
   */
  async store(event: IEvent, aggregateId: string, userId?: string): Promise<StoredEvent> {
    const storedEvent: StoredEvent = {
      id: this.generateId(),
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
    console.log(`[EventStore] Stored event: ${storedEvent.eventType}`, {
      aggregateId,
      version: storedEvent.metadata.version,
    });

    return storedEvent;
  }

  /**
   * Get all events for an aggregate
   */
  async getEventsForAggregate(aggregateId: string): Promise<StoredEvent[]> {
    return this.events.filter((event) => event.aggregateId === aggregateId);
  }

  /**
   * Get events by filter
   */
  async getEvents(filter: EventFilter = {}): Promise<StoredEvent[]> {
    let filtered = [...this.events];

    if (filter.aggregateId) {
      filtered = filtered.filter((e) => e.aggregateId === filter.aggregateId);
    }

    if (filter.eventType) {
      filtered = filtered.filter((e) => e.eventType === filter.eventType);
    }

    if (filter.fromDate) {
      filtered = filtered.filter((e) => e.createdAt >= filter.fromDate!);
    }

    if (filter.toDate) {
      filtered = filtered.filter((e) => e.createdAt <= filter.toDate!);
    }

    if (filter.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Replay events for an aggregate
   * Useful for debugging or rebuilding aggregate state
   */
  async replayEvents(aggregateId: string): Promise<IEvent[]> {
    const events = await this.getEventsForAggregate(aggregateId);
    console.log(`[EventStore] Replaying ${events.length} events for aggregate ${aggregateId}`);
    return events.map((e) => e.eventData);
  }

  /**
   * Get event count
   */
  async getEventCount(filter: EventFilter = {}): Promise<number> {
    const events = await this.getEvents(filter);
    return events.length;
  }

  /**
   * Clear all events (for testing)
   */
  async clear(): Promise<void> {
    this.events = [];
    this.eventVersion = 0;
    console.log("[EventStore] Cleared all events");
  }

  /**
   * Generate unique ID
   * In production, use UUID or database-generated ID
   */
  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
