import { Injectable } from '@nestjs/common'
import { BaseJob, SchedulerRegistry } from '@workspace/nestjs-scheduler'

import { VerificationTokenRepository } from '@/auth/repositories/verification-token.repository'

import type { JobResult } from '@workspace/nestjs-scheduler'

/**
 * CleanupExpiredTokensJob
 *
 * Deletes expired rows from the `verifications` table.
 * DB configuration (cron, enabled, timeout) is managed in `scheduled_jobs`.
 * Default: runs every hour.
 */
@Injectable()
export class CleanupExpiredTokensJob extends BaseJob {
  readonly jobName = 'auth.cleanup-expired-tokens'
  override readonly defaultCron = '0 * * * *'
  override readonly description = 'Delete expired verification tokens from the database'

  constructor(
    private readonly tokenRepo: VerificationTokenRepository,
    registry: SchedulerRegistry,
  ) {
    super(registry)
  }

  async run(): Promise<JobResult> {
    const deleted = await this.tokenRepo.deleteExpired()
    return { deleted }
  }
}
