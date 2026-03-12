import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { ScheduledJobRepository } from './scheduled-job.repository.js'

import type { BaseJob } from './base.job.js'
import type { ScheduledJobConfig } from './types.js'

/**
 * SchedulerRegistry
 *
 * Global singleton that holds the map of `jobName → BaseJob`.
 * Jobs self-register by calling `registry.register(this)` inside their
 * own `onModuleInit()` hook (handled automatically by `BaseJob`).
 *
 * Registration is skipped entirely when `SCHEDULER_ENABLED` is not `true`,
 * so no resources are allocated on instances that do not run the scheduler
 * (e.g. read-only API replicas in a PM2 cluster).
 *
 * `SchedulerService.onApplicationBootstrap()` calls `initializeJobs()` after
 * all modules have initialised, which syncs each job's defaults to the DB and
 * returns only the jobs that are currently enabled.
 */
@Injectable()
export class SchedulerRegistry {
  private readonly logger = new Logger(SchedulerRegistry.name)
  private readonly jobs = new Map<string, BaseJob>()

  constructor(
    private readonly config: ConfigService,
    private readonly scheduledJobRepo: ScheduledJobRepository,
  ) {}

  /**
   * Register a job.
   *
   * Silently skipped when `SCHEDULER_ENABLED != true` so that jobs are never
   * allocated on instances where the scheduler should not run (e.g. API
   * replicas in a PM2 cluster). This prevents accidental double-execution and
   * unnecessary DB connections on those workers.
   */
  register(job: BaseJob): void {
    const schedulerEnabled = this.config.get<boolean>('SCHEDULER_ENABLED') ?? false
    if (!schedulerEnabled) {
      this.logger.debug(`Scheduler disabled — job not registered: ${job.jobName}`)
      return
    }

    if (this.jobs.has(job.jobName)) {
      this.logger.warn(`Duplicate job registration ignored: ${job.jobName}`)
      return
    }

    this.jobs.set(job.jobName, job)
    this.logger.debug(`Registered job: ${job.jobName}`)
  }

  get(name: string): BaseJob | undefined {
    return this.jobs.get(name)
  }

  getAll(): BaseJob[] {
    return [...this.jobs.values()]
  }

  /**
   * Initialize all registered jobs against the database and return those that
   * are currently enabled.
   *
   * For each registered job this method:
   *  1. Inserts a DB row with code-defined defaults if none exists yet.
   *  2. Enforces `enabled = false` when `job.defaultEnabled` is `false` (so a
   *     developer can hard-disable a job via code and it stays disabled until
   *     `defaultEnabled` is changed back to `true`).
   *  3. Filters out jobs whose `enabled` column is `false` in the DB.
   *
   * **PM2 cluster safety**: all DB operations here are idempotent — the insert
   * uses `ON CONFLICT DO NOTHING` and the conditional update is a no-op when
   * the value is already correct — so multiple workers initializing at the same
   * time produce the same result without conflicts.
   */
  async initializeJobs(): Promise<Array<{ job: BaseJob; config: ScheduledJobConfig }>> {
    const active: Array<{ job: BaseJob; config: ScheduledJobConfig }> = []

    for (const job of this.jobs.values()) {
      const config = await this.scheduledJobRepo.ensureExists(
        job.jobName,
        job.defaultCron,
        job.defaultTimeoutMs,
        job.defaultEnabled,
        job.description,
      )

      if (!config.enabled) {
        this.logger.log(`  ⏸  ${job.jobName} — disabled in DB, skipping`)
        continue
      }

      active.push({ job, config })
    }

    return active
  }
}
