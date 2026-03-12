import { Inject, Injectable } from '@nestjs/common'
import { todosTable } from '@workspace/database'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import { eq } from 'drizzle-orm'

import type { Todo, InsertTodo } from '@workspace/database'
import type { DrizzleDb } from '@workspace/nestjs-drizzle'

/**
 * Todo Repository Drizzle implementation
 *
 * Implements TodoRepository interface using Drizzle ORM
 */
@Injectable()
export class TodoRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

  async findAll(): Promise<Todo[]> {
    return this.db.select().from(todosTable)
  }

  async findById(id: string): Promise<Todo | null> {
    const [todo] = await this.db.select().from(todosTable).where(eq(todosTable.id, id))

    return todo ?? null
  }

  async create(data: Omit<InsertTodo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    const [todo] = await this.db.insert(todosTable).values(data).returning()

    if (!todo) {
      throw new Error('Failed to create todo')
    }

    return todo
  }

  async update(
    id: string,
    data: Partial<Omit<InsertTodo, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Todo | null> {
    const [todo] = await this.db
      .update(todosTable)
      .set(data)
      .where(eq(todosTable.id, id))
      .returning()

    return todo ?? null
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(todosTable).where(eq(todosTable.id, id)).returning()

    return result.length > 0
  }
}
