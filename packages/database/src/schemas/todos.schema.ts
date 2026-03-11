import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Todos table
 */
export const todosTable = pgTable(
  'todos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    isCompleted: boolean('is_completed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('todos_is_completed_idx').on(table.isCompleted),
    index('todos_created_at_idx').on(table.createdAt),
  ],
)

export type Todo = typeof todosTable.$inferSelect
export type InsertTodo = typeof todosTable.$inferInsert
