import { Inject } from '@nestjs/common'
import { CommandHandler, EventBus } from '@nestjs/cqrs'

import { USER_REPOSITORY } from '@/modules/users/application/ports/user.repository.port'
import { UserUpdatedEvent } from '@/modules/users/domain/events/user.events'
import { UserNotFoundException } from '@/shared-kernel/domain/exceptions'

import { UpdateUserCommand } from './update-user.command'

import type { UserRepository } from '@/modules/users/application/ports/user.repository.port'
import type { User } from '@/modules/users/domain/user.entity'
import type { ICommandHandler } from '@nestjs/cqrs'

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, User> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.userRepository.update(command.id, command.data)

    if (!user) {
      throw new UserNotFoundException(command.id)
    }

    // Publish domain event
    this.eventBus.publish(new UserUpdatedEvent(user.id, command.data))

    return user
  }
}
