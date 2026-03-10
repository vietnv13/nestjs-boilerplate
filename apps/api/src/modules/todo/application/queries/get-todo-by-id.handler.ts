import { QueryHandler } from "@nestjs/cqrs";
import type { IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetTodoByIdQuery } from "./get-todo-by-id.query";
import { TODO_REPOSITORY } from "../ports/todo.repository.port";
import type { TodoRepository } from "../ports/todo.repository.port";
import type { Todo } from "@workspace/database";
import { NotFoundException } from "@/shared-kernel/domain/exceptions";

@QueryHandler(GetTodoByIdQuery)
export class GetTodoByIdHandler implements IQueryHandler<GetTodoByIdQuery, Todo> {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
  ) {}

  async execute(query: GetTodoByIdQuery): Promise<Todo> {
    const todo = await this.todoRepository.findById(query.id);

    if (!todo) {
      throw new NotFoundException("Todo", query.id);
    }

    return todo;
  }
}
