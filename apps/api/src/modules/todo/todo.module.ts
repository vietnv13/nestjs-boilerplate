import { Module } from '@nestjs/common'

import { TodoRepository } from '@/modules/todo/infrastructure/repositories/todo.repository'
import { TodoController } from '@/modules/todo/presentation/controllers/todo.controller'
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
