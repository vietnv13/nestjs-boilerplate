import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { QueueJobRepository } from './queue-job.repository'
import { QUEUE_DRIVER } from './queue.port'

import type { IQueueDriver } from './queue.port'
import type { DispatchOptions, DispatchedJob } from './queue.types'
import type { Env } from '@/app/config/env.schema'
import type { QueueJobDatabase } from '@workspace/database'

/**
 * QueueService
 *
 * The single entry-point for dispatching jobs from any module.
 *
 * @example
 * ```ts
 * // Inject in any service:
 * constructor(private readonly queue: QueueService) {}
 *
 * // Fire-and-forget
 * await this.queue.dispatch('send-welcome-email', { userId: '123' })
 *
 * // With options
 * await this.queue.dispatch('resize-image', { assetId: 'abc' }, {
 *   delay: 5_000,       // start after 5 seconds
 *   maxAttempts: 3,     // retry up to 3 times on failure
 *   priority: 10,       // higher priority (redis driver)
 * })
 *
 * // Retrieve the tracking record afterwards
 * const job = await this.queue.find(dispatched.id)
 * ```
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name)
  private readonly defaultQueue: string

  constructor(
    @Inject(QUEUE_DRIVER) private readonly driver: IQueueDriver,
    private readonly jobRepo: QueueJobRepository,
    config: ConfigService<Env, true>,
  ) {
    this.defaultQueue = config.get('QUEUE_NAME', { infer: true })
  }

  /**
   * Dispatch a job to the queue.
   *
   * A DB record is created immediately (status = "pending").
   * For the sync driver the handler runs before this method returns.
   * For the redis driver the handler runs asynchronously in a worker.
   *
   * @param name    Handler name — must match `BaseQueueHandler.jobName`.
   * @param payload Arbitrary data passed verbatim to the handler.
   * @param options Dispatch configuration.
   * @returns       The created `queue_jobs` row.
   */
  async dispatch(
    name: string,
    payload: Record<string, unknown>,
    options: DispatchOptions = {},
  ): Promise<DispatchedJob> {
    const resolved: Required<DispatchOptions> = {
      queue: options.queue ?? this.defaultQueue,
      delay: options.delay ?? 0,
      priority: options.priority ?? 0,
      maxAttempts: options.maxAttempts ?? 1,
      jobId: options.jobId ?? crypto.randomUUID(),
    }

    const record = await this.jobRepo.create({
      name,
      queue: resolved.queue,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: resolved.maxAttempts,
      priority: resolved.priority,
      delayMs: resolved.delay > 0 ? resolved.delay : null,
    })

    this.logger.debug(`Dispatching job "${name}" [${record.id}] queue="${resolved.queue}"`)

    return this.driver.enqueue(record.id, name, payload, resolved)
  }

  /**
   * Look up a job by its DB id.
   */
  async find(id: string): Promise<QueueJobDatabase | null> {
    return this.jobRepo.findById(id)
  }

  /**
   * Cancel a pending job.
   * Has no effect on jobs that are already processing, completed, or failed.
   */
  async cancel(id: string): Promise<void> {
    await this.jobRepo.markCancelled(id)
  }
}
