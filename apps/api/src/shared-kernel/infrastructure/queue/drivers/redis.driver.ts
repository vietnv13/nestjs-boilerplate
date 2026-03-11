import { hostname } from 'node:os'

import { WorkerHost, Processor, InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { QueueJobRepository } from '@/shared-kernel/infrastructure/queue/queue-job.repository'
import { QueueRegistry } from '@/shared-kernel/infrastructure/queue/queue.registry'

import type { IQueueDriver } from '@/shared-kernel/infrastructure/queue/queue.port'
import type {
  DispatchOptions,
  DispatchedJob,
} from '@/shared-kernel/infrastructure/queue/queue.types'
import type { Job as BullJob, Queue as BullQueue } from 'bullmq'

export const BULL_QUEUE_NAME = 'BULL_QUEUE_NAME'

interface BullJobData {
  jobId: string
  payload: Record<string, unknown>
}

/**
 * RedisQueueDriver
 *
 * Enqueues jobs into BullMQ / Redis.
 * Works in tandem with RedisQueueWorker which processes them.
 */
@Injectable()
export class RedisQueueDriver implements IQueueDriver {
  private readonly logger = new Logger(RedisQueueDriver.name)

  constructor(
    @InjectQueue(BULL_QUEUE_NAME) private readonly bullQueue: BullQueue<BullJobData>,
    private readonly jobRepo: QueueJobRepository,
  ) {}

  async enqueue(
    jobId: string,
    name: string,
    payload: Record<string, unknown>,
    options: Required<DispatchOptions>,
  ): Promise<DispatchedJob> {
    const bullJob = await this.bullQueue.add(
      name,
      { jobId, payload },
      {
        jobId: options.jobId === jobId ? undefined : options.jobId,
        delay: options.delay > 0 ? options.delay : undefined,
        priority: options.priority,
        attempts: options.maxAttempts,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 1000 },
      },
    )

    await this.jobRepo.setExternalId(jobId, bullJob.id ?? jobId)
    this.logger.debug(`Job "${name}" [${jobId}] enqueued → BullMQ id=${bullJob.id}`)

    return this.jobRepo.findById(jobId).then((j) => j!)
  }
}

/**
 * RedisQueueWorker
 *
 * BullMQ worker that dequeues and dispatches jobs to registered handlers.
 * Uses QueueRegistry to look up the handler by job name.
 */
@Processor(BULL_QUEUE_NAME)
export class RedisQueueWorker extends WorkerHost {
  private readonly logger = new Logger(RedisQueueWorker.name)
  private readonly instanceId = `${hostname()}:${process.pid}`

  constructor(
    private readonly registry: QueueRegistry,
    private readonly jobRepo: QueueJobRepository,
  ) {
    super()
  }

  async process(job: BullJob<BullJobData>): Promise<Record<string, unknown>> {
    const { jobId, payload } = job.data
    const name = job.name

    const handler = this.registry.get(name)
    if (!handler) {
      const msg = `No handler registered for queue job "${name}"`
      await this.jobRepo.markFailed(
        jobId,
        msg,
        undefined,
        0,
        job.attemptsMade + 1,
        job.opts.attempts ?? 1,
      )
      throw new NotFoundException(msg)
    }

    await this.jobRepo.markProcessing(jobId, this.instanceId)
    const startedAt = Date.now()

    try {
      const result = await handler.handle(payload)
      const durationMs = Date.now() - startedAt
      await this.jobRepo.markCompleted(jobId, result, durationMs)
      this.logger.debug(`Job "${name}" [${jobId}] completed in ${durationMs}ms`)
      return result
    } catch (error_) {
      const durationMs = Date.now() - startedAt
      const error = error_ instanceof Error ? error_.message : String(error_)
      const stack = error_ instanceof Error ? error_.stack : undefined
      const attempt = job.attemptsMade + 1
      const maxAttempts = job.opts.attempts ?? 1
      await this.jobRepo.markFailed(jobId, error, stack, durationMs, attempt, maxAttempts)
      this.logger.error(
        `Job "${name}" [${jobId}] attempt ${attempt}/${maxAttempts} failed: ${error}`,
      )
      throw error_ // rethrow so BullMQ handles retry
    }
  }
}
