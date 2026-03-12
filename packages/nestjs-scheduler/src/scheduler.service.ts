import { hostname } from 'node:os'

import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron as Croner } from 'croner'

import { RedisLockService } from '@workspace/nestjs-lock'

import { JobExecutionRepository } from './job-execution.repository.js'
import { ScheduledJobRepository } from './scheduled-job.repository.js'
import { SchedulerRegistry } from './scheduler.registry.js'

import type { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common'

class JobTimeoutError extends Error {
  constructor(jobName: string, ms: number) {
    super(`Job "${jobName}" timed out after ${ms}ms`)
    this.name = 'JobTimeoutError'
  }
}

/**
 * SchedulerService
 *
 * Orchestrates job discovery, DB config loading, cron scheduling,
 * Redis locking, and execution logging.
 *
 * Execution flow per cron tick:
 *   1. Attempt Redis SET NX lock — if another PM2 worker already holds it,
 *      log as 'skipped' and exit immediately (no DB write for skipped runs).
 *   2. Run job.run() wrapped in a timeout.
 *   3. Write execution record (success / failed / timeout) to `job_executions`.
 *   4. Release the Redis lock.
 */
@Injectable()
export class SchedulerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name)
  private readonly cronJobs: Croner[] = []

  /**
   * Stable identifier for this PM2 worker across restarts within the same host.
   * Used as the Redis lock value and stored in `job_executions.instance_id`.
   */
  private readonly instanceId = `${hostname()}:${process.pid}`

  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly scheduledJobRepo: ScheduledJobRepository,
    private readonly executionRepo: JobExecutionRepository,
    private readonly lockService: RedisLockService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Manually trigger a job run (used by dev-only diagnostics endpoints).
   * Uses the DB-configured timeout if the job exists, or inserts defaults first.
   */
  async runOnce(jobName: string): Promise<void> {
    const job = this.registry.get(jobName)
    if (!job) throw new Error(`Job not found in registry: ${jobName}`)

    const config = await this.scheduledJobRepo.ensureExists(
      job.jobName,
      job.defaultCron,
      job.defaultTimeoutMs,
      job.defaultEnabled,
      job.description,
    )

    await this.runJob(jobName, config.timeoutMs)
  }

  async onApplicationBootstrap(): Promise<void> {
    const enabled = this.config.get<boolean>('SCHEDULER_ENABLED') ?? false
    if (!enabled) {
      this.logger.log('Scheduler is DISABLED (set SCHEDULER_ENABLED=true to enable)')
      return
    }

    const jobs = this.registry.getAll()
    this.logger.log(`Initializing ${jobs.length} scheduled job(s) [instance=${this.instanceId}]`)
    if (jobs.length === 0) {
      this.logger.warn(
        'No scheduled jobs registered. Ensure job providers are included in their feature module providers array.',
      )
    }

    for (const job of jobs) {
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

      const cronJob = new Croner(
        config.cron,
        { protect: true }, // prevent overlapping runs on the same instance
        () => {
          // Croner callback can be async; always catch so errors never become silent unhandled rejections.
          void this.runJob(job.jobName, config.timeoutMs).catch((error: unknown) => {
            this.logger.error(`[${job.jobName}] scheduler tick failed`, { error })
          })
        },
      )

      this.cronJobs.push(cronJob)
      const nextRun = cronJob.nextRun()
      this.logger.log(
        `  ✓  ${job.jobName} [${config.cron}] next=${nextRun?.toISOString() ?? 'n/a'}`,
      )
    }
  }

  onModuleDestroy(): void {
    if (this.cronJobs.length === 0) {
      return
    }

    for (const job of this.cronJobs) {
      job.stop()
    }
    this.logger.log(
      `Scheduler stopped (${this.cronJobs.length} cron job(s)) [instance=${this.instanceId}]`,
    )
  }

  private async runJob(jobName: string, timeoutMs: number): Promise<void> {
    const lockKey = `scheduler:lock:${jobName}`
    const lockToken = await this.lockService.acquire(lockKey, timeoutMs)
    if (!lockToken) {
      this.logger.debug(`[${jobName}] lock held by another instance — skipping`)
      return
    }

    const startedAt = new Date()
    let result: Record<string, unknown> | null = null
    let error: string | null = null
    let status: 'success' | 'failed' | 'timeout' = 'success'

    try {
      const job = this.registry.get(jobName)
      if (!job) throw new Error(`Job not found in registry: ${jobName}`)

      this.logger.log(`[${jobName}] starting — instance=${this.instanceId}`)
      result = await this.runWithTimeout(job.run.bind(job), timeoutMs, jobName)
      this.logger.log(`[${jobName}] completed`, { result })
    } catch (error_: unknown) {
      if (error_ instanceof JobTimeoutError) {
        status = 'timeout'
        error = error_.message
      } else {
        status = 'failed'
        error =
          error_ instanceof Error ? `${error_.message}\n${error_.stack ?? ''}` : String(error_)
      }
      this.logger.error(`[${jobName}] ${status}`, { error })
    } finally {
      const finishedAt = new Date()

      await this.executionRepo.create({
        jobName,
        startedAt,
        finishedAt,
        status,
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        result,
        error,
        instanceId: this.instanceId,
      })

      await this.lockService.release(lockKey, lockToken)
    }
  }

  private runWithTimeout<T>(fn: () => Promise<T>, ms: number, jobName: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new JobTimeoutError(jobName, ms)), ms)

      fn()
        .then((value: T) => {
          clearTimeout(timer)
          resolve(value)
        })
        .catch((error: unknown) => {
          clearTimeout(timer)
          reject(error instanceof Error ? error : new Error(String(error)))
        })
    })
  }
}
