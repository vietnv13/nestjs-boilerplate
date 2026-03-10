import { CommandHandler, EventBus, type ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateUserCommand } from "./update-user.command";
import { USER_REPOSITORY, type UserRepository } from "../ports/user.repository.port";
import { UserUpdatedEvent } from "../../domain/events/user.events";
import { UserNotFoundException } from "@/shared-kernel/domain/exceptions";
import type { User } from "../../domain/user.entity";

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, User> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.userRepository.update(command.id, command.data);

    if (!user) {
      throw new UserNotFoundException(command.id);
    }

    // Publish domain event
    this.eventBus.publish(new UserUpdatedEvent(user.id, command.data));

    return user;
  }
}
