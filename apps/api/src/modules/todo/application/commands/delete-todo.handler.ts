import { Inject } from '@nestjs/common'
import { CommandHandler, EventBus } from '@nestjs/cqrs'

import { TODO_REPOSITORY } from '@/modules/todo/application/ports/todo.repository.port'
import { TodoDeletedEvent } from '@/modules/todo/domain/events/todo.events'
import { NotFoundException } from '@/shared-kernel/domain/exceptions'

import { DeleteTodoCommand } from './delete-todo.command'

import type { TodoRepository } from '@/modules/todo/application/ports/todo.repository.port'
import type { ICommandHandler } from '@nestjs/cqrs'

@CommandHandler(DeleteTodoCommand)
export class DeleteTodoHandler implements ICommandHandler<DeleteTodoCommand, void> {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTodoCommand): Promise<void> {
    const deleted = await this.todoRepository.delete(command.id)

    if (!deleted) {
      throw new NotFoundException('Todo', command.id)
    }

    // Publish domain event
    this.eventBus.publish(new TodoDeletedEvent(command.id))
  }
}
