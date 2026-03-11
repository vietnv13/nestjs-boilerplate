import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

import { usersTable } from './users.schema.js'

/**
 * Authentication provider identifier
 */
export type AuthProvider = 'email' | 'google' | 'github' | 'phone' | 'saml' | 'oidc'

/**
 * Accounts table
 *
 * Unified multi-provider auth account storage, compatible with Better Auth.
 * One user can have multiple accounts (email + OAuth).
 * `providerId + accountId` is unique per user.
 * `password` is only set for the `email` provider; NULL for OAuth.
 */
export const accountsTable = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('accounts_provider_account_idx').on(table.providerId, table.accountId),
    index('accounts_userId_idx').on(table.userId),
  ],
)

export type AccountDatabase = typeof accountsTable.$inferSelect
export type InsertAccountDatabase = typeof accountsTable.$inferInsert
