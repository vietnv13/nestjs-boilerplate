import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Verifications table
 *
 * Short-lived tokens for email/phone verification, password reset, 2FA, etc.
 * Tokens are deleted immediately after successful use.
 * One valid token per identifier at a time.
 */
export const verificationsTable = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)

export type VerificationTokenDatabase = typeof verificationsTable.$inferSelect
export type InsertVerificationTokenDatabase = typeof verificationsTable.$inferInsert
