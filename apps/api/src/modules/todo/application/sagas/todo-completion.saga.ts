import { Injectable } from '@nestjs/common'
import { Saga } from '@nestjs/cqrs'
import { Observable } from 'rxjs'
import { delay, map } from 'rxjs/operators'

import { TodoCompletedEvent } from '@/modules/todo/domain/events/todo.events'
import { BaseSaga } from '@/shared-kernel/infrastructure/events/sagas/base.saga'

import type { IEvent } from '@nestjs/cqrs'

/**
 * Todo Completion Saga
 *
 * Reacts to TodoCompletedEvent and orchestrates follow-up actions
 * (update user statistics, check achievements, etc.).
 */
@Injectable()
export class TodoCompletionSaga extends BaseSaga {
  @Saga()
  saga(events$: Observable<IEvent>): Observable<IEvent | null> {
    return this.filterEvents(events$, TodoCompletedEvent).pipe(
      delay(50),
      map((event: TodoCompletedEvent) => {
        this.log('Todo completion saga triggered', {
          todoId: event.todoId,
          eventType: event.eventType,
        })

        this.updateUserStatistics(event.todoId)
        this.checkAchievements(event.todoId)

        return null
      }),
    )
  }

  private updateUserStatistics(todoId: string): void {
    this.log('Updating user statistics', { todoId })
    // TODO: Dispatch UpdateUserStatisticsCommand
  }

  private checkAchievements(todoId: string): void {
    this.log('Checking for achievements', { todoId })
    // TODO: Dispatch CheckAchievementsCommand
  }
}
