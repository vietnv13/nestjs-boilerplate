import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

import { usersTable } from './users.schema.js'

/**
 * User preferences stored in the profiles.preferences JSONB column
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  lang?: string
  timezone?: string
  notifications?: boolean
}

/**
 * Profiles table
 *
 * Extended user profile data in a 1:1 relationship with users.
 * Separating this from users keeps the core user record lightweight.
 */
export const profilesTable = pgTable('profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 50 }),
  avatarUrl: text('avatar_url'),
  bio: varchar('bio', { length: 500 }),
  preferences: jsonb('preferences').$type<UserPreferences>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type ProfileDatabase = typeof profilesTable.$inferSelect
export type InsertProfileDatabase = typeof profilesTable.$inferInsert
