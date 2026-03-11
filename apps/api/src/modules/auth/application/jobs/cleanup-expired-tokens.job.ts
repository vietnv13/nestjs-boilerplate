import { Inject, Injectable } from '@nestjs/common'

import { VERIFICATION_TOKEN_REPOSITORY } from '@/modules/auth/application/ports/verification-token.repository.port'
import { BaseJob } from '@/shared-kernel/infrastructure/scheduler/base.job'
import { SchedulerRegistry } from '@/shared-kernel/infrastructure/scheduler/scheduler.registry'

import type { VerificationTokenRepository } from '@/modules/auth/application/ports/verification-token.repository.port'
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
  override readonly defaultCron = '* * * * *'
  override readonly description = 'Delete expired verification tokens from the database'

  constructor(
    @Inject(VERIFICATION_TOKEN_REPOSITORY)
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
