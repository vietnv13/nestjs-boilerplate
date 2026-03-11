# @workspace/nestjs-scheduler

Distributed cron scheduler for NestJS.

- Jobs are configured/stored in the database.
- Redis locking prevents duplicate execution across multiple instances.

## Usage

Import once:

```ts
import { Module } from '@nestjs/common'
import { SchedulerModule } from '@workspace/nestjs-scheduler'

@Module({
  imports: [SchedulerModule],
})
export class AppModule {}
```

Create a job (register it by adding to a feature module `providers`):

```ts
import { Injectable } from '@nestjs/common'
import { BaseJob, SchedulerRegistry } from '@workspace/nestjs-scheduler'
import type { JobResult } from '@workspace/nestjs-scheduler'

@Injectable()
export class CleanupJob extends BaseJob {
  readonly jobName = 'cleanup.temp-files'
  override readonly defaultCron = '0 3 * * *'

  constructor(registry: SchedulerRegistry) {
    super(registry)
  }

  async run(): Promise<JobResult> {
    return { ok: true }
  }
}
```

## Environment variables

- `SCHEDULER_ENABLED` (default `false`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

