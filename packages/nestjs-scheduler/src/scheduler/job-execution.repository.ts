import { Inject, Injectable } from '@nestjs/common'
import { jobExecutionsTable } from '@workspace/database'

import { DB_TOKEN } from '@workspace/nestjs-drizzle'

import type { JobExecutionStatus } from './types.js'
import type { DrizzleDb } from '@workspace/nestjs-drizzle'

export interface CreateExecutionParams {
  jobName: string
  startedAt: Date
  finishedAt: Date
  status: JobExecutionStatus
  durationMs: number
  result: Record<string, unknown> | null
  error: string | null
  instanceId: string
}

/**
 * JobExecutionRepository
 *
 * Append-only writes to `job_executions`.
 * Each row is a complete audit record of one run attempt.
 */
@Injectable()
export class JobExecutionRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async create(params: CreateExecutionParams): Promise<void> {
    await this.db.insert(jobExecutionsTable).values({
      jobName: params.jobName,
      startedAt: params.startedAt,
      finishedAt: params.finishedAt,
      status: params.status,
      durationMs: params.durationMs,
      result: params.result ?? undefined,
      error: params.error,
      instanceId: params.instanceId,
    })
  }
}
