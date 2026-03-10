import { Injectable } from "@nestjs/common";
import { type IEvent, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { map, delay } from "rxjs/operators";
import { BaseSaga } from "./base.saga";
import { UserCreatedEvent } from "@/modules/users/domain/events/user.events";

/**
 * User Registration Saga
 *
 * Orchestrates the user registration workflow:
 * 1. Send welcome email
 * 2. Create user profile
 * 3. Assign default permissions
 *
 * This demonstrates the saga pattern for complex, multi-step workflows
 */
@Injectable()
export class UserRegistrationSaga extends BaseSaga {
  /**
   * Saga that reacts to UserCreatedEvent
   */
  @Saga()
  saga(events$: Observable<IEvent>): Observable<any> {
    return this.filterEvents(events$, UserCreatedEvent).pipe(
      // Add small delay to ensure transaction is committed
      delay(100),
      map((event: UserCreatedEvent) => {
        this.log("User registration saga triggered", {
          userId: event.userId,
          eventType: event.eventType,
        });

        // In a real application, these would be commands dispatched to the command bus
        // For now, we'll log the steps that would be taken
        this.sendWelcomeEmail(event.userId);
        this.createUserProfile(event.userId);
        this.assignDefaultPermissions(event.userId);

        return null; // Sagas don't need to return anything
      }),
    );
  }

  /**
   * Send welcome email to new user
   * In production, this would dispatch a SendEmailCommand
   */
  private sendWelcomeEmail(userId: string): void {
    this.log("Sending welcome email", { userId });
    // TODO: Dispatch SendWelcomeEmailCommand
    // this.eventBus.execute(new SendWelcomeEmailCommand(userId));
  }

  /**
   * Create user profile with default settings
   * In production, this would dispatch a CreateProfileCommand
   */
  private createUserProfile(userId: string): void {
    this.log("Creating user profile", { userId });
    // TODO: Dispatch CreateUserProfileCommand
    // this.eventBus.execute(new CreateUserProfileCommand(userId));
  }

  /**
   * Assign default permissions to new user
   * In production, this would dispatch an AssignPermissionsCommand
   */
  private assignDefaultPermissions(userId: string): void {
    this.log("Assigning default permissions", { userId });
    // TODO: Dispatch AssignDefaultPermissionsCommand
    // this.eventBus.execute(new AssignDefaultPermissionsCommand(userId, ['read:own-profile']));
  }
}
