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
 * Reacts to TodoCompletedEvent. Extend this to dispatch follow-up commands
 * (e.g. update user statistics, check achievements).
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

        return null
      }),
    )
  }
}
