import { Injectable } from "@nestjs/common";
import { type IEvent, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { map, delay } from "rxjs/operators";
import { BaseSaga } from "./base.saga";
import { TodoCompletedEvent } from "@/modules/todo/domain/events/todo.events";

/**
 * Todo Completion Saga
 *
 * Orchestrates actions when a todo is completed:
 * 1. Update user statistics
 * 2. Check for achievements
 * 3. Send notification if needed
 *
 * This demonstrates saga pattern for business workflows
 */
@Injectable()
export class TodoCompletionSaga extends BaseSaga {
  @Saga()
  saga(events$: Observable<IEvent>): Observable<any> {
    return this.filterEvents(events$, TodoCompletedEvent).pipe(
      delay(50),
      map((event: TodoCompletedEvent) => {
        this.log("Todo completion saga triggered", {
          todoId: event.todoId,
          eventType: event.eventType,
        });

        // In production, these would be commands
        this.updateUserStatistics(event.todoId);
        this.checkAchievements(event.todoId);

        return null;
      }),
    );
  }

  private updateUserStatistics(todoId: string): void {
    this.log("Updating user statistics", { todoId });
    // TODO: Dispatch UpdateUserStatisticsCommand
  }

  private checkAchievements(todoId: string): void {
    this.log("Checking for achievements", { todoId });
    // TODO: Dispatch CheckAchievementsCommand
  }
}
