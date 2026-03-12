import { Inject, Injectable } from '@nestjs/common'
import { queueJobsTable } from '@workspace/database'
import { and, eq } from 'drizzle-orm'

import { DB_TOKEN } from '@workspace/nestjs-drizzle'

import type { DrizzleDb } from '@workspace/nestjs-drizzle'
import type { InsertQueueJobDatabase, QueueJobDatabase, QueueJobStatus } from '@workspace/database'

@Injectable()
export class QueueJobRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

  async create(
    data: Omit<InsertQueueJobDatabase, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<QueueJobDatabase> {
    const [job] = await this.db.insert(queueJobsTable).values(data).returning()
    if (!job) throw new Error('Failed to create queue job record')
    return job
  }

  async findById(id: string): Promise<QueueJobDatabase | null> {
    const [job] = await this.db
      .select()
      .from(queueJobsTable)
      .where(eq(queueJobsTable.id, id))
      .limit(1)
    return job ?? null
  }

  async findByExternalId(externalId: string): Promise<QueueJobDatabase | null> {
    const [job] = await this.db
      .select()
      .from(queueJobsTable)
      .where(eq(queueJobsTable.externalId, externalId))
      .limit(1)
    return job ?? null
  }

  async markProcessing(id: string, instanceId: string): Promise<void> {
    await this.db
      .update(queueJobsTable)
      .set({
        status: 'processing',
        startedAt: new Date(),
        instanceId,
        updatedAt: new Date(),
      })
      .where(and(eq(queueJobsTable.id, id), eq(queueJobsTable.status, 'pending')))
  }

  async markCompleted(
    id: string,
    result: Record<string, unknown>,
    durationMs: number,
  ): Promise<void> {
    await this.db
      .update(queueJobsTable)
      .set({
        status: 'completed',
        result,
        finishedAt: new Date(),
        durationMs,
        updatedAt: new Date(),
      })
      .where(eq(queueJobsTable.id, id))
  }

  async markFailed(
    id: string,
    error: string,
    errorStack: string | undefined,
    durationMs: number,
    attempts: number,
    maxAttempts: number,
  ): Promise<void> {
    const status: QueueJobStatus = attempts >= maxAttempts ? 'failed' : 'pending'
    await this.db
      .update(queueJobsTable)
      .set({
        status,
        error,
        errorStack,
        finishedAt: status === 'failed' ? new Date() : null,
        durationMs,
        attempts,
        updatedAt: new Date(),
      })
      .where(eq(queueJobsTable.id, id))
  }

  async incrementAttempts(id: string): Promise<number> {
    const job = await this.findById(id)
    const next = (job?.attempts ?? 0) + 1
    await this.db
      .update(queueJobsTable)
      .set({ attempts: next, updatedAt: new Date() })
      .where(eq(queueJobsTable.id, id))
    return next
  }

  async markCancelled(id: string): Promise<void> {
    await this.db
      .update(queueJobsTable)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(queueJobsTable.id, id), eq(queueJobsTable.status, 'pending')))
  }

  async setExternalId(id: string, externalId: string): Promise<void> {
    await this.db
      .update(queueJobsTable)
      .set({ externalId, updatedAt: new Date() })
      .where(eq(queueJobsTable.id, id))
  }
}
