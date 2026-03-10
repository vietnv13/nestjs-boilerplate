import { Injectable, Logger } from "@nestjs/common";
import { EventBus, ofType } from "@nestjs/cqrs";

import type { IEvent } from "@nestjs/cqrs";
import type { Observable } from "rxjs";

/**
 * Base Saga
 *
 * Abstract base class for all sagas. Sagas react to domain events and
 * orchestrate follow-up actions (e.g., dispatching commands, calling services).
 *
 * Concrete sagas must implement `saga()` and decorate it with `@Saga()`.
 */
@Injectable()
export abstract class BaseSaga {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly eventBus: EventBus) {}

  abstract saga(events$: Observable<IEvent>): Observable<IEvent | null>;

  /** Filter the event stream to a specific event type */
  protected filterEvents<T extends IEvent>(
    events$: Observable<IEvent>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...eventTypes: (new (...args: any[]) => T)[]
  ): Observable<T> {
    return events$.pipe(ofType(...eventTypes));
  }

  protected log(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(message, data);
  }

  protected logError(message: string, error: unknown): void {
    this.logger.error(message, error instanceof Error ? error.stack : error);
  }
}
