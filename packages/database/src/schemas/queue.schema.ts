import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * Queue jobs — append-only log of every dispatched job.
 *
 * Both the sync and redis drivers write here so you can track
 * status, inspect payloads, and query results regardless of driver.
 */
export const queueJobsTable = pgTable(
  'queue_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /** Handler name, e.g. "send-welcome-email" */
    name: varchar('name', { length: 255 }).notNull(),

    /** Logical queue the job belongs to (default: "default") */
    queue: varchar('queue', { length: 100 }).notNull().default('default'),

    /** Input payload passed to the handler */
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),

    /** Current lifecycle status */
    status: text('status', {
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    })
      .notNull()
      .default('pending'),

    /** How many execution attempts have been made */
    attempts: integer('attempts').notNull().default(0),

    /** Maximum allowed attempts before marking as failed */
    maxAttempts: integer('max_attempts').notNull().default(1),

    /** Priority — higher value = processed first (redis driver) */
    priority: integer('priority').notNull().default(0),

    /** Optional delay in ms before the job becomes eligible (redis driver) */
    delayMs: integer('delay_ms'),

    /** When the job actually started executing */
    startedAt: timestamp('started_at', { withTimezone: true }),

    /** When the job finished (success or failure) */
    finishedAt: timestamp('finished_at', { withTimezone: true }),

    /** Wall-clock duration of the last attempt in ms */
    durationMs: integer('duration_ms'),

    /** Return value from the handler (on success) */
    result: jsonb('result').$type<Record<string, unknown>>(),

    /** Error message (on failure) */
    error: text('error'),

    /** Stack trace (on failure, dev-mode only) */
    errorStack: text('error_stack'),

    /** Instance (hostname:pid) or BullMQ worker ID that processed the job */
    instanceId: varchar('instance_id', { length: 255 }),

    /** External job ID from the redis driver (BullMQ job ID) */
    externalId: varchar('external_id', { length: 255 }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('queue_jobs_name_idx').on(table.name),
    index('queue_jobs_queue_idx').on(table.queue),
    index('queue_jobs_status_idx').on(table.status),
    index('queue_jobs_created_at_idx').on(table.createdAt),
    index('queue_jobs_external_id_idx').on(table.externalId),
  ],
)

export type QueueJobDatabase = typeof queueJobsTable.$inferSelect
export type InsertQueueJobDatabase = typeof queueJobsTable.$inferInsert

export type QueueJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
