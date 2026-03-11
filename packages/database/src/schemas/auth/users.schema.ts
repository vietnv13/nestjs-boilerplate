import { boolean, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

/**
 * Users table
 *
 * Core user entity, compatible with Better Auth.
 * Extended data lives in related tables: profiles (1:1), accounts (1:N), sessions (1:N).
 */
export const usersTable = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    role: text('role'),
    banned: boolean('banned').notNull().default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)],
)

export type UserDatabase = typeof usersTable.$inferSelect
export type InsertUserDatabase = typeof usersTable.$inferInsert
