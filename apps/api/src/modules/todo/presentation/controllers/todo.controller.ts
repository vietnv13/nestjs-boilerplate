import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CreateTodoCommand } from "@/modules/todo/application/commands/create-todo.command";
import { UpdateTodoCommand } from "@/modules/todo/application/commands/update-todo.command";
import { DeleteTodoCommand } from "@/modules/todo/application/commands/delete-todo.command";
import { GetAllTodosQuery } from "@/modules/todo/application/queries/get-all-todos.query";
import { GetTodoByIdQuery } from "@/modules/todo/application/queries/get-todo-by-id.query";
import { CreateTodoDto } from "@/modules/todo/presentation/dtos/create-todo.dto";
import { TodoResponseDto } from "@/modules/todo/presentation/dtos/todo-response.dto";
import { UpdateTodoDto } from "@/modules/todo/presentation/dtos/update-todo.dto";

import type { Todo } from "@workspace/database";

/**
 * Todo Controller
 *
 * Handles HTTP requests for todos using CQRS pattern
 */
@ApiTags("todos")
@Controller("todos")
export class TodoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * Get all todos
   */
  @Get()
  @ApiOperation({ summary: "Get all todos" })
  @ApiResponse({
    status: 200,
    description: "Returns todos list",
    type: [TodoResponseDto],
  })
  async findAll(): Promise<Todo[]> {
    const query = new GetAllTodosQuery();
    return this.queryBus.execute(query);
  }

  /**
   * Get todo by ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Get todo by ID" })
  @ApiResponse({
    status: 200,
    description: "Returns todo",
    type: TodoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Todo not found",
  })
  async findById(@Param("id") id: string): Promise<Todo> {
    const query = new GetTodoByIdQuery(id);
    return this.queryBus.execute(query);
  }

  /**
   * Create new todo
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create new todo" })
  @ApiResponse({
    status: 201,
    description: "Todo created",
    type: TodoResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: "Validation failed",
  })
  async create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    const command = new CreateTodoCommand(createTodoDto.title, createTodoDto.description);
    return this.commandBus.execute(command);
  }

  /**
   * Update todo
   */
  @Patch(":id")
  @ApiOperation({ summary: "Update todo" })
  @ApiResponse({
    status: 200,
    description: "Todo updated",
    type: TodoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Todo not found",
  })
  @ApiResponse({
    status: 422,
    description: "Validation failed",
  })
  async update(@Param("id") id: string, @Body() updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const command = new UpdateTodoCommand(id, updateTodoDto);
    return this.commandBus.execute(command);
  }

  /**
   * Delete todo
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete todo" })
  @ApiResponse({
    status: 204,
    description: "Todo deleted",
  })
  @ApiResponse({
    status: 404,
    description: "Todo not found",
  })
  async delete(@Param("id") id: string): Promise<void> {
    const command = new DeleteTodoCommand(id);
    await this.commandBus.execute(command);
  }
}
