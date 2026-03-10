import { QueryHandler } from "@nestjs/cqrs";
import type { IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetAllTodosQuery } from "./get-all-todos.query";
import { TODO_REPOSITORY } from "../ports/todo.repository.port";
import type { TodoRepository } from "../ports/todo.repository.port";
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
