import { relations } from 'drizzle-orm'

import {
  accountsTable,
  assetLinksTable,
  assetsTable,
  profilesTable,
  sessionsTable,
  usersTable,
} from './schemas/index.js'

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  profile: one(profilesTable, {
    fields: [usersTable.id],
    references: [profilesTable.userId],
  }),
  accounts: many(accountsTable),
  sessions: many(sessionsTable),
}))

export const profilesRelations = relations(profilesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [profilesTable.userId],
    references: [usersTable.id],
  }),
}))

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
}))

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}))

export const assetsRelations = relations(assetsTable, ({ many, one }) => ({
  links: many(assetLinksTable),
  creator: one(usersTable, {
    fields: [assetsTable.creatorId],
    references: [usersTable.id],
  }),
}))

export const assetLinksRelations = relations(assetLinksTable, ({ one }) => ({
  asset: one(assetsTable, {
    fields: [assetLinksTable.assetId],
    references: [assetsTable.id],
  }),
}))
