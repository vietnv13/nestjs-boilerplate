import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const articleStatusEnum = pgEnum('article_status', ['draft', 'published', 'archived'])

/**
 * Articles table
 */
export const articlesTable = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    slug: text('slug').notNull().unique(),
    status: articleStatusEnum('status').notNull().default('draft'),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('articles_slug_idx').on(table.slug),
    index('articles_status_idx').on(table.status),
  ],
)

export type ArticleDatabase = typeof articlesTable.$inferSelect
export type InsertArticleDatabase = typeof articlesTable.$inferInsert
