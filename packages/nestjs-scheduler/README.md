# @workspace/nestjs-scheduler

Distributed cron scheduler for NestJS.

- Jobs are configured/stored in the database.
- Redis locking prevents duplicate execution across multiple PM2 cluster instances.
- Jobs are only registered and scheduled on workers where `SCHEDULER_ENABLED=true`.

## Usage

Import once in `AppModule`:

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
  // override readonly defaultEnabled = false  ← uncomment to ship disabled

  constructor(registry: SchedulerRegistry) {
    super(registry)
  }

  async run(): Promise<JobResult> {
    return { ok: true }
  }
}
```

Add the job to its feature module:

```ts
@Module({ providers: [CleanupJob] })
export class CleanupModule {}
```

## BaseJob overridable properties

| Property | Default | Description |
| --- | --- | --- |
| `defaultCron` | `'*/5 * * * *'` | Initial cron expression written to the DB row on first startup. Operators can change it via the DB. |
| `defaultTimeoutMs` | `30000` | Initial timeout (ms) written to the DB row on first startup. |
| `defaultEnabled` | `true` | Initial enabled state written to the DB row on first startup. When overridden to `false`, the scheduler enforces `enabled = false` in the DB on every startup (see note below). |
| `description` | `undefined` | Optional human-readable description stored in the DB row. |

> **`defaultEnabled` behaviour:**
>
> - `defaultEnabled = true` (the default) — operators can freely toggle `enabled` in the DB; their changes persist across restarts.
> - `defaultEnabled = false` — the scheduler writes `enabled = false` to the DB on every startup, enforcing the developer's intent. Operators cannot re-enable the job via the DB while the code keeps it `false`. Use this to ship a job that must not run until a future release changes `defaultEnabled` back to `true`.

## Startup flow

```text
onModuleInit  (each BaseJob)
  └─ SchedulerRegistry.register()
       └─ skip if SCHEDULER_ENABLED != true  ← new: no-op on disabled workers

onApplicationBootstrap  (SchedulerService)
  └─ SchedulerRegistry.initializeJobs()       ← new: DB check is centralised here
       ├─ ensureExists()  — insert defaults if row is missing
       ├─ enforce enabled=false when defaultEnabled=false
       └─ return only DB-enabled jobs
  └─ schedule Croner cron job for each active job
```

## PM2 cluster

Each PM2 worker independently runs the cron scheduler when `SCHEDULER_ENABLED=true`. Only **one** worker executes a given job per tick — enforced by a Redis `SET NX` lock acquired at execution time.

Workers where `SCHEDULER_ENABLED` is `false` (e.g. read-only API replicas) never register jobs, so they consume no scheduler resources at all.

DB operations during `initializeJobs()` are idempotent:

- The initial `INSERT` uses `ON CONFLICT DO NOTHING`.
- The conditional `UPDATE` for `defaultEnabled = false` is a no-op when the value is already correct.

Multiple workers starting simultaneously produce the same result without race conditions.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `SCHEDULER_ENABLED` | `false` | Set to `true` on the worker(s) that should run scheduled jobs. |
| `REDIS_HOST` | — | Redis host for distributed locking. |
| `REDIS_PORT` | — | Redis port. |
| `REDIS_PASSWORD` | — | Redis password (if required). |
