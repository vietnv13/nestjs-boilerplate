import type { DispatchOptions, DispatchedJob } from './queue.types.js'

export const QUEUE_DRIVER = Symbol('QUEUE_DRIVER')

/**
 * IQueueDriver — low-level interface implemented by each driver.
 *
 * QueueService delegates to this after creating the DB record.
 */
export interface IQueueDriver {
  /**
   * Enqueue (or immediately execute, for the sync driver) a job.
   *
   * @param jobId   The `queue_jobs.id` already persisted to the DB.
   * @param name    Handler name.
   * @param payload Input data for the handler.
   * @param options Dispatch options.
   */
  enqueue(
    jobId: string,
    name: string,
    payload: Record<string, unknown>,
    options: Required<DispatchOptions>,
  ): Promise<DispatchedJob>
}
