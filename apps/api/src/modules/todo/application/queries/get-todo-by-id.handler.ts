import { Inject } from "@nestjs/common";
import { QueryHandler } from "@nestjs/cqrs";

import { TODO_REPOSITORY } from "@/modules/todo/application/ports/todo.repository.port";
import { NotFoundException } from "@/shared-kernel/domain/exceptions";

import { GetTodoByIdQuery } from "./get-todo-by-id.query";

import type { TodoRepository } from "@/modules/todo/application/ports/todo.repository.port";
import type { IQueryHandler } from "@nestjs/cqrs";
import type { Todo } from "@workspace/database";

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
