import { CommandHandler, EventBus, type ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateUserCommand } from "./create-user.command";
import { USER_REPOSITORY, type UserRepository } from "../ports/user.repository.port";
import { UserCreatedEvent } from "../../domain/events/user.events";
import { UserAlreadyExistsException } from "@/shared-kernel/domain/exceptions";
import type { User } from "../../domain/user.entity";

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, User> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    // Check if user already exists
    const exists = await this.userRepository.existsByEmail(command.email);
    if (exists) {
      throw new UserAlreadyExistsException(command.email);
    }

    // Create user
    const user = await this.userRepository.create({
      email: command.email,
      name: command.name,
      role: command.role,
    });

    // Publish domain event
    this.eventBus.publish(new UserCreatedEvent(user.id, user.email, user.name));

    return user;
  }
}
