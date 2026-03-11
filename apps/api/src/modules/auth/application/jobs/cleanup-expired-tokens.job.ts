import { Injectable } from '@nestjs/common'

import { VerificationTokenRepositoryImpl } from '@/modules/auth/infrastructure/repositories/verification-token.repository'
import { BaseJob } from '@/shared-kernel/infrastructure/scheduler/base.job'
import { SchedulerRegistry } from '@/shared-kernel/infrastructure/scheduler/scheduler.registry'

import type { JobResult } from '@/shared-kernel/infrastructure/scheduler/types'

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
    private readonly tokenRepo: VerificationTokenRepositoryImpl,
    registry: SchedulerRegistry,
  ) {
    super(registry)
  }

  async run(): Promise<JobResult> {
    const deleted = await this.tokenRepo.deleteExpired()
    return { deleted }
  }
}
