import { Inject } from '@nestjs/common'
import { CommandHandler, EventBus } from '@nestjs/cqrs'

import { TODO_REPOSITORY } from '@/modules/todo/application/ports/todo.repository.port'
import { TodoCreatedEvent } from '@/modules/todo/domain/events/todo.events'
import { ValidationException } from '@/shared-kernel/domain/exceptions'

import { CreateTodoCommand } from './create-todo.command'

import type { TodoRepository } from '@/modules/todo/application/ports/todo.repository.port'
import type { ICommandHandler } from '@nestjs/cqrs'
import type { Todo } from '@workspace/database'

@CommandHandler(CreateTodoCommand)
export class CreateTodoHandler implements ICommandHandler<CreateTodoCommand, Todo> {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateTodoCommand): Promise<Todo> {
    if (!command.title || command.title.trim().length === 0) {
      throw new ValidationException('Title is required and cannot be empty')
    }

    if (command.title.length > 200) {
      throw new ValidationException('Title cannot exceed 200 characters')
    }

    const todo = await this.todoRepository.create({
      title: command.title.trim(),
      description: command.description?.trim(),
    })

    this.eventBus.publish(new TodoCreatedEvent(todo.id, todo.title))

    return todo
  }
}
