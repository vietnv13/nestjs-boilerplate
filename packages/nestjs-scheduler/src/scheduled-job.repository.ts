import { Inject, Injectable } from '@nestjs/common'
import { scheduledJobsTable } from '@workspace/database'
import { eq } from 'drizzle-orm'

import { DB_TOKEN } from '@workspace/nestjs-drizzle'

import type { ScheduledJobConfig } from './types.js'
import type { DrizzleDb } from '@workspace/nestjs-drizzle'

/**
 * ScheduledJobRepository
 *
 * Reads job configuration from the `scheduled_jobs` table.
 * On first startup `ensureExists()` inserts a row with the code-provided
 * defaults so operators can then tune cron/enabled/timeout via the DB.
 */
@Injectable()
export class ScheduledJobRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async findByName(name: string): Promise<ScheduledJobConfig | null> {
    const rows = await this.db
      .select()
      .from(scheduledJobsTable)
      .where(eq(scheduledJobsTable.name, name))
      .limit(1)

    return rows.length > 0 ? this.toConfig(rows[0]!) : null
  }

  /**
   * Insert the row if it does not exist yet (using ON CONFLICT DO NOTHING),
   * then fetch and return the current config (which may have been customized
   * by an operator).
   *
   * If the row already exists and `defaultEnabled` differs from the stored
   * `enabled` value, the DB record is updated so that code-defined defaults
   * are always reflected on startup.
   */
  async ensureExists(
    name: string,
    defaultCron: string,
    defaultTimeoutMs: number,
    defaultEnabled: boolean,
    description?: string,
  ): Promise<ScheduledJobConfig> {
    await this.db
      .insert(scheduledJobsTable)
      .values({
        name,
        cron: defaultCron,
        timeoutMs: defaultTimeoutMs,
        enabled: defaultEnabled,
        description: description ?? null,
      })
      .onConflictDoNothing()

    // When the developer explicitly sets `defaultEnabled = false` in a subclass,
    // enforce that intent on every startup so operators cannot accidentally
    // enable a job that has been code-disabled.
    // When `defaultEnabled = true` (the class default), operators can freely
    // toggle `enabled` via the DB without having it reset on restart.
    if (!defaultEnabled) {
      await this.db
        .update(scheduledJobsTable)
        .set({ enabled: false })
        .where(eq(scheduledJobsTable.name, name))
    }

    const row = await this.findByName(name)
    if (!row) throw new Error(`Failed to upsert scheduled_job row for: ${name}`)

    return row
  }

  private toConfig(row: typeof scheduledJobsTable.$inferSelect): ScheduledJobConfig {
    return {
      id: row.id,
      name: row.name,
      cron: row.cron,
      enabled: row.enabled,
      timeoutMs: row.timeoutMs,
      description: row.description,
    }
  }
}
