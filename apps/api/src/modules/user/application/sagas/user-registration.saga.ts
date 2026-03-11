import { Injectable } from '@nestjs/common'
import { Saga } from '@nestjs/cqrs'
import { Observable } from 'rxjs'
import { delay, map } from 'rxjs/operators'

import { UserCreatedEvent } from '@/modules/user/domain/events/user.events'
import { BaseSaga } from '@/shared-kernel/infrastructure/events/sagas/base.saga'

import type { IEvent } from '@nestjs/cqrs'

/**
 * User Registration Saga
 *
 * Reacts to UserCreatedEvent. Extend this to dispatch post-registration commands
 * (e.g. send welcome email, create user profile, assign default permissions).
 */
@Injectable()
export class UserRegistrationSaga extends BaseSaga {
  @Saga()
  saga(events$: Observable<IEvent>): Observable<IEvent | null> {
    return this.filterEvents(events$, UserCreatedEvent).pipe(
      delay(100),
      map((event: UserCreatedEvent) => {
        this.log('User registration saga triggered', {
          userId: event.userId,
          eventType: event.eventType,
        })

        return null
      }),
    )
  }
}
