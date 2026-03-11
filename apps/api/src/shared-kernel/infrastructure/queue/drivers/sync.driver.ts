import { hostname } from 'node:os'

import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { QueueJobRepository } from '@/shared-kernel/infrastructure/queue/queue-job.repository'
import { QueueRegistry } from '@/shared-kernel/infrastructure/queue/queue.registry'

import type { IQueueDriver } from '@/shared-kernel/infrastructure/queue/queue.port'
import type {
  DispatchOptions,
  DispatchedJob,
} from '@/shared-kernel/infrastructure/queue/queue.types'

/**
 * SyncQueueDriver
 *
 * Executes the handler synchronously in the same Node.js event-loop turn.
 * Ideal for development, testing, and simple deployments with no Redis.
 *
 * - No worker processes needed.
 * - The job always runs before `dispatch()` resolves.
 * - Retries are attempted synchronously on failure.
 */
@Injectable()
export class SyncQueueDriver implements IQueueDriver {
  private readonly logger = new Logger(SyncQueueDriver.name)
  private readonly instanceId = `${hostname()}:${process.pid}`

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
      // Honour delay by deferring execution — fire-and-forget
      setTimeout(() => void this.execute(jobId, name, handler, payload, options), options.delay)
      return this.jobRepo.findById(jobId).then((j) => j!)
    }

    return this.execute(jobId, name, handler, payload, options)
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
