import { Injectable } from "@nestjs/common";
import { Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { delay, map } from "rxjs/operators";

import { UserCreatedEvent } from "@/modules/users/domain/events/user.events";
import { BaseSaga } from "@/shared-kernel/infrastructure/events/sagas/base.saga";

import type { IEvent } from "@nestjs/cqrs";

/**
 * User Registration Saga
 *
 * Reacts to UserCreatedEvent and orchestrates the post-registration workflow:
 * send welcome email, create user profile, assign default permissions.
 */
@Injectable()
export class UserRegistrationSaga extends BaseSaga {
  @Saga()
  saga(events$: Observable<IEvent>): Observable<IEvent | null> {
    return this.filterEvents(events$, UserCreatedEvent).pipe(
      delay(100),
      map((event: UserCreatedEvent) => {
        this.log("User registration saga triggered", {
          userId: event.userId,
          eventType: event.eventType,
        });

        this.sendWelcomeEmail(event.userId);
        this.createUserProfile(event.userId);
        this.assignDefaultPermissions(event.userId);

        return null;
      }),
    );
  }

  private sendWelcomeEmail(userId: string): void {
    this.log("Sending welcome email", { userId });
    // TODO: Dispatch SendWelcomeEmailCommand
  }

  private createUserProfile(userId: string): void {
    this.log("Creating user profile", { userId });
    // TODO: Dispatch CreateUserProfileCommand
  }

  private assignDefaultPermissions(userId: string): void {
    this.log("Assigning default permissions", { userId });
    // TODO: Dispatch AssignDefaultPermissionsCommand
  }
}
