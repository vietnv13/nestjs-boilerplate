import { Module } from '@nestjs/common'

import { TodoController } from '@/modules/todo/controllers/todo.controller'
import { TodoRepository } from '@/modules/todo/repositories/todo.repository'
import { TodoService } from '@/modules/todo/todo.service'

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
