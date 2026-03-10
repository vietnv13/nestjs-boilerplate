import { Injectable, Logger } from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";

import { EventStoreService } from "./event-store.service";

import type { OnModuleInit } from "@nestjs/common";
import type { IEvent } from "@nestjs/cqrs";

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

  private storeEvent(event: IEvent): void {
    try {
      const record = event as Record<string, unknown>;
      const aggregateId = (record.aggregateId ?? record.userId ?? "unknown") as string;
      this.eventStore.store(event, aggregateId);
    } catch (error) {
      this.logger.error("Failed to store event", { eventType: event.constructor.name, error });
    }
  }
}
