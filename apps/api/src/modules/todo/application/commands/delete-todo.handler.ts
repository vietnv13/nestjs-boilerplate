import { CommandHandler } from "@nestjs/cqrs";
import type { ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import { DeleteTodoCommand } from "./delete-todo.command";
import { TODO_REPOSITORY } from "../ports/todo.repository.port";
import type { TodoRepository } from "../ports/todo.repository.port";
import { NotFoundException } from "@/shared-kernel/domain/exceptions";
import { TodoDeletedEvent } from "@/modules/todo/domain/events/todo.events";

@CommandHandler(DeleteTodoCommand)
export class DeleteTodoHandler implements ICommandHandler<DeleteTodoCommand, void> {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTodoCommand): Promise<void> {
    const deleted = await this.todoRepository.delete(command.id);

    if (!deleted) {
      throw new NotFoundException("Todo", command.id);
    }

    // Publish domain event
    this.eventBus.publish(new TodoDeletedEvent(command.id));
  }
}
