import { Inject } from "@nestjs/common";
import { QueryHandler } from "@nestjs/cqrs";

import { TODO_REPOSITORY } from "@/modules/todo/application/ports/todo.repository.port";

import { GetAllTodosQuery } from "./get-all-todos.query";

import type { TodoRepository } from "@/modules/todo/application/ports/todo.repository.port";
import type { IQueryHandler } from "@nestjs/cqrs";
import type { Todo } from "@workspace/database";

@QueryHandler(GetAllTodosQuery)
export class GetAllTodosHandler implements IQueryHandler<GetAllTodosQuery, Todo[]> {
  constructor(
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
  ) {}

  async execute(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }
}
