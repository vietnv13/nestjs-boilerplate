import { CommandHandler } from "@nestjs/cqrs";
import type { ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import { CreateTodoCommand } from "./create-todo.command";
import { TODO_REPOSITORY } from "../ports/todo.repository.port";
import type { TodoRepository } from "../ports/todo.repository.port";
import type { Todo } from "@workspace/database";
import { TodoCreatedEvent } from "@/modules/todo/domain/events/todo.events";
import { ValidationException } from "@/shared-kernel/domain/exceptions";

@CommandHandler(CreateTodoCommand)
export class CreateTodoHandler implements ICommandHandler<CreateTodoCommand, Todo> {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateTodoCommand): Promise<Todo> {
    // Validate title
    if (!command.title || command.title.trim().length === 0) {
      throw new ValidationException("Title is required and cannot be empty");
    }

    if (command.title.length > 200) {
      throw new ValidationException("Title cannot exceed 200 characters");
    }

    // Create todo
    const todo = await this.todoRepository.create({
      title: command.title.trim(),
      description: command.description?.trim(),
    });

    // Publish domain event
    this.eventBus.publish(new TodoCreatedEvent(todo.id, todo.title));

    return todo;
  }
}
