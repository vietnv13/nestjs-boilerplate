import { Module } from '@nestjs/common'

import { TodoController } from '@/todo/controllers/todo.controller'
import { TodoRepository } from '@/todo/repositories/todo.repository'
import { TodoService } from '@/todo/todo.service'

/**
 * Todo Module
 *
 * Todo feature module (controller + service + repository).
 */
@Module({
  controllers: [TodoController],
  providers: [TodoRepository, TodoService],
})
export class TodoModule {}
