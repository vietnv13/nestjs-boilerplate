import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { usersTable } from './users.schema.js'

/**
 * Sessions table
 *
 * Multi-device session management, compatible with Better Auth.
 * Session revocation is handled by deletion rather than a status flag.
 */
export const sessionsTable = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    impersonatedBy: text('impersonated_by'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('sessions_user_id_idx').on(table.userId),
    uniqueIndex('sessions_token_idx').on(table.token),
    index('sessions_expires_at_idx').on(table.expiresAt),
  ],
)

export type SessionDatabase = typeof sessionsTable.$inferSelect
export type InsertSessionDatabase = typeof sessionsTable.$inferInsert
