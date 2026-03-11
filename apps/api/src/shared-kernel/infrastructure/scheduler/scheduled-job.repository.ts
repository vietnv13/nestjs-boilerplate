import { Inject, Injectable } from '@nestjs/common'
import { scheduledJobsTable } from '@workspace/database'
import { eq } from 'drizzle-orm'

import { DB_TOKEN } from '@/shared-kernel/infrastructure/db/db.port'

import type { ScheduledJobConfig } from './types'
import type { DrizzleDb } from '@/shared-kernel/infrastructure/db/db.port'

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
   */
  async ensureExists(
    name: string,
    defaultCron: string,
    defaultTimeoutMs: number,
    description?: string,
  ): Promise<ScheduledJobConfig> {
    await this.db
      .insert(scheduledJobsTable)
      .values({
        name,
        cron: defaultCron,
        timeoutMs: defaultTimeoutMs,
        description: description ?? null,
      })
      .onConflictDoNothing()

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
