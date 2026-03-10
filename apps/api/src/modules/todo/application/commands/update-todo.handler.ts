import { Inject } from '@nestjs/common'
import { CommandHandler, EventBus } from '@nestjs/cqrs'

import { TODO_REPOSITORY } from '@/modules/todo/application/ports/todo.repository.port'
import { TodoUpdatedEvent, TodoCompletedEvent } from '@/modules/todo/domain/events/todo.events'
import { NotFoundException, ValidationException } from '@/shared-kernel/domain/exceptions'

import { UpdateTodoCommand } from './update-todo.command'

import type { TodoRepository } from '@/modules/todo/application/ports/todo.repository.port'
import type { ICommandHandler } from '@nestjs/cqrs'
import type { Todo } from '@workspace/database'

@CommandHandler(UpdateTodoCommand)
export class UpdateTodoHandler implements ICommandHandler<UpdateTodoCommand, Todo> {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateTodoCommand): Promise<Todo> {
    // Validate title if provided
    if (command.data.title !== undefined) {
      if (!command.data.title || command.data.title.trim().length === 0) {
        throw new ValidationException('Title cannot be empty')
      }
      if (command.data.title.length > 200) {
        throw new ValidationException('Title cannot exceed 200 characters')
      }
    }

    // Get existing todo to check completion status
    const existingTodo = await this.todoRepository.findById(command.id)
    if (!existingTodo) {
      throw new NotFoundException('Todo', command.id)
    }

    // Update todo
    const todo = await this.todoRepository.update(command.id, command.data)

    if (!todo) {
      throw new NotFoundException('Todo', command.id)
    }

    // Publish update event
    this.eventBus.publish(new TodoUpdatedEvent(todo.id, command.data))

    // Publish completion event if status changed to completed
    if (command.data.isCompleted === true && !existingTodo.isCompleted) {
      this.eventBus.publish(new TodoCompletedEvent(todo.id))
    }

    return todo
  }
}
