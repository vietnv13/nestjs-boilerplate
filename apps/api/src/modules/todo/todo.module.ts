import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { CreateTodoHandler } from "@/modules/todo/application/commands/create-todo.handler";
import { DeleteTodoHandler } from "@/modules/todo/application/commands/delete-todo.handler";
import { UpdateTodoHandler } from "@/modules/todo/application/commands/update-todo.handler";
import { TODO_REPOSITORY } from "@/modules/todo/application/ports/todo.repository.port";
import { GetAllTodosHandler } from "@/modules/todo/application/queries/get-all-todos.handler";
import { GetTodoByIdHandler } from "@/modules/todo/application/queries/get-todo-by-id.handler";
import { TodoCompletionSaga } from "@/modules/todo/application/sagas/todo-completion.saga";
import { TodoRepositoryImpl } from "@/modules/todo/infrastructure/repositories/todo.repository";
import { TodoController } from "@/modules/todo/presentation/controllers/todo.controller";

const CommandHandlers = [CreateTodoHandler, UpdateTodoHandler, DeleteTodoHandler];
const QueryHandlers = [GetAllTodosHandler, GetTodoByIdHandler];
const Sagas = [TodoCompletionSaga];

/**
 * Todo Module
 *
 * Provides complete implementation of todo functionality using CQRS pattern
 */
@Module({
  imports: [CqrsModule],
  controllers: [TodoController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Sagas,
    {
      provide: TODO_REPOSITORY,
      useClass: TodoRepositoryImpl,
    },
  ],
})
export class TodoModule {}
