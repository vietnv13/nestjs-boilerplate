import { Injectable } from "@nestjs/common";
import { EventBus, type IEvent, ofType } from "@nestjs/cqrs";
import type { Observable } from "rxjs";

/**
 * Base Saga Class
 *
 * Provides common functionality for all sagas
 * Sagas orchestrate complex workflows by listening to domain events
 * and triggering commands in response
 */
@Injectable()
export abstract class BaseSaga {
  constructor(protected readonly eventBus: EventBus) {}

  /**
   * Define saga logic
   * Override this method in concrete saga implementations
   */
  abstract saga(events$: Observable<IEvent>): Observable<any>;

  /**
   * Helper to filter events by type
   */
  protected filterEvents<T extends IEvent>(
    events$: Observable<IEvent>,
    ...eventTypes: Array<new (...args: any[]) => T>
  ): Observable<T> {
    return events$.pipe(ofType(...eventTypes));
  }

  /**
   * Log saga execution
   */
  protected log(message: string, data?: any): void {
    console.log(`[Saga] ${message}`, data || "");
  }

  /**
   * Log saga errors
   */
  protected logError(message: string, error: any): void {
    console.error(`[Saga Error] ${message}`, error);
  }
}
