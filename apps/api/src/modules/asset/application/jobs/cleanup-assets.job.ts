import { Injectable } from '@nestjs/common'
import dayjs from 'dayjs'

import { AssetService } from '@/modules/asset/application/services/asset.service'
import { BaseJob } from '@/shared-kernel/infrastructure/scheduler/base.job'
import { SchedulerRegistry } from '@/shared-kernel/infrastructure/scheduler/scheduler.registry'

import type { JobResult } from '@/shared-kernel/infrastructure/scheduler/types'

/**
 * CleanupAssetsJob
 *
 * Deletes assets that:
 * - were never linked to any owner for 90 days since creation, OR
 * - were soft deleted for 90 days since deletion.
 *
 * Only performs hard delete after successful storage deletion.
 */
@Injectable()
export class CleanupAssetsJob extends BaseJob {
  readonly jobName = 'asset.cleanup-assets'
  override readonly defaultCron = '0 3 * * *'
  override readonly description = 'Hard delete unused/soft-deleted assets older than 90 days'

  constructor(
    private readonly assets: AssetService,
    registry: SchedulerRegistry,
  ) {
    super(registry)
  }

  async run(): Promise<JobResult> {
    const cutoff = dayjs().subtract(90, 'day').toDate()
    return await this.assets.purgeExpiredAssets({ cutoff, limit: 500 })
  }
}
