import { Injectable, Logger } from '@nestjs/common'

import type { BaseJob } from './base.job'

/**
 * SchedulerRegistry
 *
 * Global singleton that holds the map of `jobName → BaseJob`.
 * Jobs self-register by calling `registry.register(this)` inside their
 * own `onModuleInit()` hook (handled automatically by `BaseJob`).
 *
 * `SchedulerService.onModuleInit()` reads from this registry after all
 * modules have initialised, so all jobs are guaranteed to be present.
 */
@Injectable()
export class SchedulerRegistry {
  private readonly logger = new Logger(SchedulerRegistry.name)
  private readonly jobs = new Map<string, BaseJob>()

  register(job: BaseJob): void {
    if (this.jobs.has(job.jobName)) {
      this.logger.warn(`Duplicate job registration ignored: ${job.jobName}`)
      return
    }
    this.jobs.set(job.jobName, job)
    this.logger.debug(`Registered job: ${job.jobName}`)
  }

  get(name: string): BaseJob | undefined {
    return this.jobs.get(name)
  }

  getAll(): BaseJob[] {
    return [...this.jobs.values()]
  }
}
