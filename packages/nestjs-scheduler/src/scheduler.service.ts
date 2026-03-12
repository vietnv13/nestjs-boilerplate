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
 *
 * Graceful shutdown (deploy / restart / SIGTERM):
 *   onModuleDestroy stops all cron schedulers first (no new ticks) then waits
 *   for every in-flight runJob promise to settle before returning, so the
 *   process is never killed mid-execution. Requires `app.enableShutdownHooks()`
 *   in main.ts so NestJS forwards OS signals to the lifecycle hooks.
 */
@Injectable()
export class SchedulerService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name)
  private readonly cronJobs: Croner[] = []

  /**
   * Tracks promises for all currently-executing job runs.
   * Populated on every cron tick and cleared when the run settles.
   * `onModuleDestroy` awaits this set to guarantee graceful shutdown.
   */
  private readonly activeRuns = new Set<Promise<void>>()

  /**
   * Set to `true` as the very first step of shutdown.
   * Guards the narrow race window between calling `job.stop()` on each
   * Croner and its internal timer being fully cancelled, ensuring no new
   * run is started after we begin draining `activeRuns`.
   */
  private isShuttingDown = false

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

    const registeredCount = this.registry.getAll().length
    this.logger.log(
      `Initializing ${registeredCount} scheduled job(s) [instance=${this.instanceId}]`,
    )
    if (registeredCount === 0) {
      this.logger.warn(
        'No scheduled jobs registered. Ensure job providers are included in their feature module providers array.',
      )
    }

    const activeJobs = await this.registry.initializeJobs()

    for (const { job, config } of activeJobs) {
      const cronJob = new Croner(
        config.cron,
        { protect: true }, // prevent overlapping runs on the same instance
        () => {
          if (this.isShuttingDown) return

          const run = this.runJob(job.jobName, config.timeoutMs).catch((error: unknown) => {
            this.logger.error(`[${job.jobName}] scheduler tick failed`, { error })
          })

          this.activeRuns.add(run)
          void run.finally(() => this.activeRuns.delete(run))
        },
      )

      this.cronJobs.push(cronJob)
      const nextRun = cronJob.nextRun()
      this.logger.log(
        `  ✓  ${job.jobName} [${config.cron}] next=${nextRun?.toISOString() ?? 'n/a'}`,
      )
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Raise the flag first so any tick firing in the narrow window between
    // here and job.stop() is discarded before it can start a new run.
    this.isShuttingDown = true

    for (const job of this.cronJobs) {
      job.stop()
    }

    if (this.activeRuns.size > 0) {
      this.logger.log(
        `Graceful shutdown: waiting for ${this.activeRuns.size} active job(s) to finish [instance=${this.instanceId}]`,
      )
      await Promise.allSettled([...this.activeRuns])
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
