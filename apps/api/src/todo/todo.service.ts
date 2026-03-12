import { Injectable } from '@nestjs/common'
import { createHttpException, ErrorCode } from '@workspace/error-code'

import { TodoRepository } from '@/todo/repositories/todo.repository'

import type { InsertTodo, Todo } from '@workspace/database'

@Injectable()
export class TodoService {
  constructor(private readonly todos: TodoRepository) {}

  findAll(): Promise<Todo[]> {
    return this.todos.findAll()
  }

  async findById(id: string): Promise<Todo> {
    const todo = await this.todos.findById(id)
    if (!todo) {
      throw createHttpException(ErrorCode.TODO_NOT_FOUND)
    }
    return todo
  }

  async create(data: Pick<InsertTodo, 'title' | 'description'>): Promise<Todo> {
    if (!data.title?.trim()) {
      throw createHttpException(ErrorCode.TODO_TITLE_REQUIRED)
    }
    return this.todos.create({
      title: data.title.trim(),
      description: data.description ?? null,
      isCompleted: false,
    })
  }

  async update(
    id: string,
    data: Partial<Pick<InsertTodo, 'title' | 'description' | 'isCompleted'>>,
  ): Promise<Todo> {
    const updated = await this.todos.update(id, {
      ...(data.title === undefined ? {} : { title: data.title.trim() }),
      ...(data.description === undefined ? {} : { description: data.description }),
      ...(data.isCompleted === undefined ? {} : { isCompleted: data.isCompleted }),
    })

    if (!updated) {
      throw createHttpException(ErrorCode.TODO_NOT_FOUND)
    }
    return updated
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.todos.delete(id)
    if (!deleted) {
      throw createHttpException(ErrorCode.TODO_NOT_FOUND)
    }
  }
}
