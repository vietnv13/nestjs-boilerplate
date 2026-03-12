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
  // Start disabled — operator must enable via DB (or omit to default to true)
  override readonly defaultEnabled = false

  constructor(registry: SchedulerRegistry) {
    super(registry)
  }

  async run(): Promise<JobResult> {
    return { ok: true }
  }
}
```

## BaseJob overridable properties

| Property           | Default         | Description                                                                                                                                                                                                        |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `defaultCron`      | `'*/5 * * * *'` | Initial cron expression written to the DB row on first startup.                                                                                                                                                    |
| `defaultTimeoutMs` | `30000`         | Initial timeout (ms) written to the DB row on first startup.                                                                                                                                                       |
| `defaultEnabled`   | `true`          | Initial enabled state written to the DB row on first startup. When set to `false`, the job is also force-disabled in the DB on every startup (operators cannot re-enable it via DB while the code keeps it false). |
| `description`      | `undefined`     | Optional human-readable description stored in the DB row.                                                                                                                                                          |

> **Note on `defaultEnabled`:** When `defaultEnabled = true` (the default), operators can freely toggle the `enabled` column in the database without it being reset on restart. When `defaultEnabled = false`, the scheduler enforces the disabled state on every startup — use this to ship a job that should not run until explicitly enabled by a code change.

## Environment variables

- `SCHEDULER_ENABLED` (default `false`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
