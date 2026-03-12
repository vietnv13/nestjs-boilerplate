import type { QueueJobDatabase } from '@workspace/database'

export type QueueJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * Options accepted by QueueService.dispatch()
 */
export interface DispatchOptions {
  /** Target queue name. Defaults to the value of QUEUE_NAME env var ("default"). */
  queue?: string
  /** Delay before the job becomes eligible to run, in milliseconds. */
  delay?: number
  /** Higher priority jobs are processed first (redis driver only). */
  priority?: number
  /** Maximum number of attempts before marking as failed. Defaults to 1. */
  maxAttempts?: number
  /**
   * Idempotency key — if supplied, the redis driver will not add a duplicate
   * job with the same key while one is still pending/processing.
   */
  jobId?: string
}

/** Return type of QueueService.dispatch() */
export type DispatchedJob = QueueJobDatabase

/** The value a handler's handle() method must resolve to. */
export type HandlerResult = Record<string, unknown>
