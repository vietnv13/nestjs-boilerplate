import { hostname } from 'node:os'

import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { QueueJobRepository } from '../queue-job.repository.js'
import { QueueRegistry } from '../queue.registry.js'

import type { IQueueDriver } from '../queue.port.js'
import type { DispatchOptions, DispatchedJob } from '../queue.types.js'
import type { OnModuleDestroy } from '@nestjs/common'

/**
 * SyncQueueDriver
 *
 * Executes the handler synchronously in the same Node.js event-loop turn.
 * Ideal for development, testing, and simple deployments with no Redis.
 *
 * - No worker processes needed.
 * - The job always runs before `dispatch()` resolves (unless `delay` is set).
 * - Retries are attempted synchronously on failure.
 *
 * Graceful shutdown:
 *   onModuleDestroy cancels all pending delay timers (marking those jobs as
 *   failed in the DB so they are not silently lost) and waits for every
 *   in-flight execution to settle before the process exits.
 *   Requires `app.enableShutdownHooks()` in main.ts.
 */
@Injectable()
export class SyncQueueDriver implements IQueueDriver, OnModuleDestroy {
  private readonly logger = new Logger(SyncQueueDriver.name)
  private readonly instanceId = `${hostname()}:${process.pid}`

  /**
   * Promises for all currently-executing jobs.
   * Drained in `onModuleDestroy` to guarantee graceful shutdown.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly activeExecutions = new Set<Promise<any>>()

  /**
   * Maps each pending delay timer to the jobId it will execute.
   * On shutdown the timers are cleared and those jobs are marked failed
   * so the DB does not silently retain orphaned `pending` rows.
   */
  private readonly pendingTimers = new Map<ReturnType<typeof setTimeout>, string>()

  /** Raised on shutdown to reject any new dispatches that arrive late. */
  private isShuttingDown = false

  constructor(
    private readonly registry: QueueRegistry,
    private readonly jobRepo: QueueJobRepository,
  ) {}

  async enqueue(
    jobId: string,
    name: string,
    payload: Record<string, unknown>,
    options: Required<DispatchOptions>,
  ): Promise<DispatchedJob> {
    if (this.isShuttingDown) {
      await this.jobRepo.markFailed(
        jobId,
        'Job rejected: queue is shutting down',
        undefined,
        0,
        1,
        options.maxAttempts,
      )
      throw new Error(`Queue is shutting down — job "${name}" [${jobId}] not accepted`)
    }

    const handler = this.registry.get(name)
    if (!handler) {
      await this.jobRepo.markFailed(
        jobId,
        `No handler registered for job "${name}"`,
        undefined,
        0,
        1,
        options.maxAttempts,
      )
      throw new NotFoundException(`No handler registered for queue job "${name}"`)
    }

    if (options.delay > 0) {
      // Honour delay by deferring execution — track the timer so it can be
      // cancelled cleanly during shutdown.
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timer)
        this.trackExecution(this.execute(jobId, name, handler, payload, options))
      }, options.delay)

      this.pendingTimers.set(timer, jobId)
      return this.jobRepo.findById(jobId).then((j) => j!)
    }

    return this.trackExecution(this.execute(jobId, name, handler, payload, options))
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true

    // Cancel every pending delay timer and mark those jobs failed so they
    // are not left as orphaned `pending` rows in the database.
    if (this.pendingTimers.size > 0) {
      this.logger.warn(
        `Graceful shutdown: cancelling ${this.pendingTimers.size} delayed job(s) [instance=${this.instanceId}]`,
      )
      for (const [timer, jobId] of this.pendingTimers) {
        clearTimeout(timer)
        await this.jobRepo.markFailed(
          jobId,
          'Job cancelled: server shutdown before delay elapsed',
          undefined,
          0,
          1,
          1,
        )
        this.logger.warn(`  ✗  Delayed job [${jobId}] cancelled`)
      }
      this.pendingTimers.clear()
    }

    // Wait for every in-flight execution to settle (success, failure, or retry
    // exhausted) before allowing the process to exit.
    if (this.activeExecutions.size > 0) {
      this.logger.log(
        `Graceful shutdown: waiting for ${this.activeExecutions.size} active job(s) to finish [instance=${this.instanceId}]`,
      )
      await Promise.allSettled([...this.activeExecutions])
    }

    this.logger.log(`SyncQueueDriver stopped [instance=${this.instanceId}]`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private trackExecution<T>(promise: Promise<T>): Promise<T> {
    this.activeExecutions.add(promise)
    void promise.finally(() => this.activeExecutions.delete(promise))
    return promise
  }

  private async execute(
    jobId: string,
    name: string,
    handler: { handle(payload: unknown): Promise<Record<string, unknown>> },
    payload: Record<string, unknown>,
    options: Required<DispatchOptions>,
  ): Promise<DispatchedJob> {
    await this.jobRepo.markProcessing(jobId, this.instanceId)
    const startedAt = Date.now()

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        const result = await handler.handle(payload)
        const durationMs = Date.now() - startedAt
        await this.jobRepo.markCompleted(jobId, result, durationMs)
        this.logger.debug(`Job "${name}" [${jobId}] completed in ${durationMs}ms`)
        return this.jobRepo.findById(jobId).then((j) => j!)
      } catch (error_) {
        const durationMs = Date.now() - startedAt
        const error = error_ instanceof Error ? error_.message : String(error_)
        const stack = error_ instanceof Error ? error_.stack : undefined
        await this.jobRepo.markFailed(jobId, error, stack, durationMs, attempt, options.maxAttempts)

        if (attempt < options.maxAttempts) {
          this.logger.warn(
            `Job "${name}" [${jobId}] attempt ${attempt}/${options.maxAttempts} failed — retrying`,
          )
        } else {
          this.logger.error(`Job "${name}" [${jobId}] failed after ${attempt} attempt(s): ${error}`)
        }
      }
    }

    return this.jobRepo.findById(jobId).then((j) => j!)
  }
}
