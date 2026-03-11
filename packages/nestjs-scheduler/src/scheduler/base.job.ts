import { Logger } from '@nestjs/common'

import type { SchedulerRegistry } from './scheduler.registry.js'
import type { JobResult } from './types.js'
import type { OnModuleInit } from '@nestjs/common'

/**
 * BaseJob
 *
 * Abstract base class for all scheduled jobs.
 * Extend this class, declare `jobName`, and implement `run()`.
 * Inject `SchedulerRegistry` as the second constructor argument;
 * the base class registers this instance automatically via `onModuleInit`.
 *
 * The `SchedulerModule` must be imported in `AppModule` (it is global),
 * so `SchedulerRegistry` is available for injection in any module.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class CleanupJob extends BaseJob {
 *   readonly jobName = 'auth.cleanup-expired-tokens'
 *
 *   constructor(
 *     private readonly tokenRepo: VerificationTokenRepositoryImpl,
 *     registry: SchedulerRegistry,
 *   ) {
 *     super(registry)
 *   }
 *
 *   async run(): Promise<JobResult> {
 *     const deleted = await this.tokenRepo.deleteExpired()
 *     return { deleted }
 *   }
 * }
 * ```
 *
 * Add `CleanupJob` to the `providers` array of the feature module — nothing else.
 * The DB row is auto-created on first startup; update `cron` / `enabled` there.
 */
export abstract class BaseJob implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name)

  abstract readonly jobName: string

  /**
   * Default cron expression used when the DB row does not exist yet.
   * Override in subclass to change the initial default.
   * @example '0 * * * *'  // every hour
   */
  readonly defaultCron: string = '*/5 * * * *'

  /**
   * Default timeout (ms) used when the DB row does not exist yet.
   */
  readonly defaultTimeoutMs: number = 30_000

  /**
   * Optional human-readable description stored in the DB row.
   */
  readonly description?: string

  constructor(private readonly registry: SchedulerRegistry) {}

  onModuleInit(): void {
    this.registry.register(this)
  }

  abstract run(): Promise<JobResult>
}
