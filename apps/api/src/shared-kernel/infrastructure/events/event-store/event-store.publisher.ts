import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import type { IEvent } from "@nestjs/cqrs";
import { EventStoreService } from "./event-store.service";

/**
 * Event Store Publisher
 *
 * Subscribes to the CQRS EventBus and persists every dispatched event to the
 * EventStoreService, enabling event sourcing and replay capabilities.
 */
@Injectable()
export class EventStorePublisher implements OnModuleInit {
  private readonly logger = new Logger(EventStorePublisher.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly eventStore: EventStoreService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe((event: IEvent) => {
      this.storeEvent(event);
    });
  }

  private async storeEvent(event: IEvent): Promise<void> {
    try {
      const aggregateId = (event as any).aggregateId ?? (event as any).userId ?? "unknown";
      await this.eventStore.store(event, aggregateId);
    } catch (error) {
      this.logger.error("Failed to store event", { eventType: event.constructor.name, error });
    }
  }
}
