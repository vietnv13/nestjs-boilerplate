import { CommandHandler, EventBus, type ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { DeleteUserCommand } from "./delete-user.command";
import { USER_REPOSITORY, type UserRepository } from "../ports/user.repository.port";
import { UserDeletedEvent } from "../../domain/events/user.events";
import { UserNotFoundException } from "@/shared-kernel/domain/exceptions";

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const deleted = await this.userRepository.delete(command.id);

    if (!deleted) {
      throw new UserNotFoundException(command.id);
    }

    // Publish domain event
    this.eventBus.publish(new UserDeletedEvent(command.id));
  }
}
