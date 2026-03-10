import { Injectable, type OnModuleInit } from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import type { IEvent } from "@nestjs/cqrs";
import { EventStoreService } from "./event-store.service";

/**
 * Event Store Publisher
 *
 * Automatically stores all published domain events to the event store
 * This enables event sourcing and event replay capabilities
 */
@Injectable()
export class EventStorePublisher implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly eventStore: EventStoreService,
  ) {}

  onModuleInit() {
    // Subscribe to all events and store them
    this.eventBus.subscribe((event: IEvent) => {
      this.storeEvent(event);
    });
  }

  private async storeEvent(event: IEvent): Promise<void> {
    try {
      // Extract aggregate ID from event if available
      const aggregateId = (event as any).aggregateId || (event as any).userId || "unknown";

      await this.eventStore.store(event, aggregateId);
    } catch (error) {
      console.error("[EventStorePublisher] Failed to store event", error);
    }
  }
}
