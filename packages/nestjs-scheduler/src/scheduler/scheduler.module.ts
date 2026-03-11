import { Global, Module } from '@nestjs/common'

import { RedisLockModule } from '../locks/redis-lock.module.js'

import { JobExecutionRepository } from './job-execution.repository.js'
import { ScheduledJobRepository } from './scheduled-job.repository.js'
import { SchedulerRegistry } from './scheduler.registry.js'
import { SchedulerService } from './scheduler.service.js'

/**
 * SchedulerModule
 *
 * Global module — import once in AppModule.
 *
 * Exports `SchedulerRegistry` so it is available for injection in any module.
 * Feature modules only need to add their job class to their `providers` array:
 *
 * ```ts
 * // In any module's providers:
 * providers: [CleanupJob]
 * ```
 *
 * The `SchedulerService` discovers all registered jobs after module init and
 * schedules them based on their `scheduled_jobs` DB row.
 *
 * Set `SCHEDULER_ENABLED=true` in the environment to activate scheduling.
 */
@Global()
@Module({
  imports: [RedisLockModule],
  providers: [SchedulerRegistry, ScheduledJobRepository, JobExecutionRepository, SchedulerService],
  exports: [SchedulerRegistry],
})
export class SchedulerModule {}
