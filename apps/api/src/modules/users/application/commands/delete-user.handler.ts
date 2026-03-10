import { Inject } from '@nestjs/common'
import { CommandHandler, EventBus } from '@nestjs/cqrs'

import { USER_REPOSITORY } from '@/modules/users/application/ports/user.repository.port'
import { UserDeletedEvent } from '@/modules/users/domain/events/user.events'
import { UserNotFoundException } from '@/shared-kernel/domain/exceptions'

import { DeleteUserCommand } from './delete-user.command'

import type { UserRepository } from '@/modules/users/application/ports/user.repository.port'
import type { ICommandHandler } from '@nestjs/cqrs'

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const deleted = await this.userRepository.delete(command.id)

    if (!deleted) {
      throw new UserNotFoundException(command.id)
    }

    // Publish domain event
    this.eventBus.publish(new UserDeletedEvent(command.id))
  }
}
