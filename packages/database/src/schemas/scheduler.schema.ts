import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

/**
 * Scheduled jobs — one row per registered job.
 * The cron expression, enabled flag, and timeout can be changed in the DB
 * without redeployment. New rows are auto-inserted on first startup with
 * code-provided defaults.
 */
export const scheduledJobsTable = pgTable(
  'scheduled_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    cron: varchar('cron', { length: 100 }).notNull(),
    enabled: boolean('enabled').notNull().default(true),
    timeoutMs: integer('timeout_ms').notNull().default(30_000),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('scheduled_jobs_name_idx').on(table.name)],
)

/**
 * Job executions — append-only audit log of every run attempt.
 */
export const jobExecutionsTable = pgTable(
  'job_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobName: varchar('job_name', { length: 255 }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: text('status', { enum: ['running', 'success', 'failed', 'skipped', 'timeout'] })
      .notNull()
      .default('running'),
    durationMs: integer('duration_ms'),
    result: jsonb('result').$type<Record<string, unknown>>(),
    error: text('error'),
    instanceId: varchar('instance_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('job_executions_job_name_idx').on(table.jobName),
    index('job_executions_started_at_idx').on(table.startedAt),
    index('job_executions_status_idx').on(table.status),
  ],
)

export type ScheduledJobDatabase = typeof scheduledJobsTable.$inferSelect
export type InsertScheduledJobDatabase = typeof scheduledJobsTable.$inferInsert
export type JobExecutionDatabase = typeof jobExecutionsTable.$inferSelect
export type InsertJobExecutionDatabase = typeof jobExecutionsTable.$inferInsert

export type JobExecutionStatus = 'running' | 'success' | 'failed' | 'skipped' | 'timeout'
