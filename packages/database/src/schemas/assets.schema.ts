import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { usersTable } from './auth/users.schema.js'

/**
 * Assets table
 *
 * Stores uploaded files and metadata. Supports optional creator ownership and soft delete.
 */
export const assetsTable = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull().unique(),
    originalFilename: text('original_filename'),
    contentType: text('content_type'),
    size: integer('size'),
    isPublic: boolean('is_public').notNull().default(false),
    creatorId: text('creator_id').references(() => usersTable.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('assets_creator_id_idx').on(table.creatorId),
    index('assets_created_at_idx').on(table.createdAt),
    index('assets_deleted_at_idx').on(table.deletedAt),
  ],
)

/**
 * Asset links table
 *
 * Generic link table to attach assets to other entities (e.g., user avatar, article images).
 * Supports multiple "slots"/types per owner, and multiple assets per slot.
 */
export const assetLinksTable = pgTable(
  'asset_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assetsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ownerType: text('owner_type').notNull(),
    ownerId: text('owner_id').notNull(),
    slot: text('slot').notNull().default('default'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('asset_links_asset_id_idx').on(table.assetId),
    index('asset_links_owner_idx').on(table.ownerType, table.ownerId),
    index('asset_links_slot_idx').on(table.slot),
    index('asset_links_deleted_at_idx').on(table.deletedAt),
  ],
)

export type AssetDatabase = typeof assetsTable.$inferSelect
export type InsertAssetDatabase = typeof assetsTable.$inferInsert
export type AssetLinkDatabase = typeof assetLinksTable.$inferSelect
export type InsertAssetLinkDatabase = typeof assetLinksTable.$inferInsert
