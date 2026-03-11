# Distributed Scheduler

The scheduler runs background cron jobs across multiple PM2 instances safely.
Redis `SET NX` locking ensures only one worker executes a given job at a time.
Job configuration (cron, enabled, timeout) lives in the database so it can be
tuned without redeployment.

---

## Quick start

### 1. Enable scheduling

```dotenv
# apps/api/.env
SCHEDULER_ENABLED=true    # default is false
```

### 2. Create a job

```ts
// src/modules/todo/archive-old-todos.job.ts
import { Injectable } from '@nestjs/common'
import { BaseJob, SchedulerRegistry } from '@workspace/nestjs-scheduler'
import type { JobResult } from '@workspace/nestjs-scheduler'

@Injectable()
export class ArchiveOldTodosJob extends BaseJob {
  readonly jobName = 'todo.archive-old' // unique key — must match DB row
  override readonly defaultCron = '0 3 * * *' // 03:00 daily (first-run default)
  override readonly description = 'Archive todos older than 90 days'

  constructor(
    private readonly todoRepo: TodoRepository,
    registry: SchedulerRegistry, // always second arg, always named `registry`
  ) {
    super(registry)
  }

  async run(): Promise<JobResult> {
    const archived = await this.todoRepo.archiveOlderThan(90)
    return { archived } // any serializable object
  }
}
```

### 3. Register in the feature module

```ts
// src/modules/todo/todo.module.ts
@Module({
  providers: [
    // ...existing providers
    ArchiveOldTodosJob, // ← that's it
  ],
})
export class TodoModule {}
```

No extra imports. `SchedulerModule` is `@Global()` and already imported in `AppModule`.

### 4. Run the database migration

```bash
pnpm --filter @workspace/database db:migrate
```

The two new tables (`scheduled_jobs`, `job_executions`) are created by the migration
generated at `packages/database/drizzle/0001_*.sql`.

---

## How it works

```
AppModule init
  └── SchedulerModule (global)
        └── SchedulerRegistry        ← singleton job map

Each feature module init
  └── MyJob.onModuleInit()           ← calls registry.register(this)

SchedulerService.onApplicationBootstrap()
  ├── reads SCHEDULER_ENABLED env
  ├── for each registered job:
  │     ├── ensureExists() in scheduled_jobs (insert if new, keep if exists)
  │     └── if enabled → schedule croner tick
  │
  └── on each cron tick:
        ├── Redis SET NX (atomic lock)  ← skips if another instance holds it
        ├── job.run() with timeout
        ├── write row to job_executions
        └── release Redis lock (Lua compare-and-delete)
```

---

## Database tables

### `scheduled_jobs`

One row per registered job. Created automatically on first startup.

| Column        | Type         | Default   | Description                                                 |
| ------------- | ------------ | --------- | ----------------------------------------------------------- |
| `id`          | uuid         | auto      | Primary key                                                 |
| `name`        | varchar(255) | —         | Unique job identifier (matches `jobName`)                   |
| `cron`        | varchar(100) | from code | Cron expression                                             |
| `enabled`     | boolean      | `true`    | Set to `false` to pause a job without redeployment          |
| `timeout_ms`  | integer      | `30000`   | Max allowed run time; job is killed and logged as `timeout` |
| `description` | text         | null      | Human-readable description                                  |

Operators can `UPDATE scheduled_jobs SET cron = '0 4 * * *' WHERE name = 'todo.archive-old'`
and it takes effect on the **next** PM2 reload (no code changes needed).

### `job_executions`

Append-only audit log. Never modified after insert.

| Column        | Type        | Description                                              |
| ------------- | ----------- | -------------------------------------------------------- |
| `id`          | uuid        | Primary key                                              |
| `job_name`    | varchar     | References `scheduled_jobs.name`                         |
| `started_at`  | timestamptz | When the lock was acquired                               |
| `finished_at` | timestamptz | When the job completed (or timed out)                    |
| `status`      | text        | `running` / `success` / `failed` / `skipped` / `timeout` |
| `duration_ms` | integer     | Wall-clock duration                                      |
| `result`      | jsonb       | Return value of `run()` on success                       |
| `error`       | text        | Error message + stack on failure/timeout                 |
| `instance_id` | varchar     | `hostname:pid` of the PM2 worker that ran it             |

Useful queries:

```sql
-- Last 20 runs of a specific job
SELECT status, duration_ms, result, error, started_at
FROM job_executions
WHERE job_name = 'todo.archive-old'
ORDER BY started_at DESC
LIMIT 20;

-- All failures in the last 24 hours
SELECT job_name, error, started_at
FROM job_executions
WHERE status IN ('failed', 'timeout')
  AND started_at > NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;

-- Average duration per job
SELECT job_name, AVG(duration_ms)::int AS avg_ms, COUNT(*) AS runs
FROM job_executions
WHERE status = 'success'
GROUP BY job_name;
```

---

## Redis locking

Each job tick acquires a Redis key `scheduler:lock:{jobName}` using `SET key token NX EX ttl`.

- **NX** — only succeeds if the key does not exist (atomic, no race condition).
- **EX** — the key expires automatically after `timeout_ms` seconds even if the
  worker crashes mid-job (self-healing).
- **Release** — a Lua script deletes the key only if its value matches the
  acquiring worker's token, preventing accidental release by a different instance.
- **Separate connection** — the lock client is a dedicated `@redis/client` connection,
  independent of the cache-manager connection, to avoid pipeline interference.

If a worker cannot acquire the lock it logs a `debug` message and returns — no
`job_executions` row is written for skipped ticks.

---

## BaseJob API reference

```ts
abstract class BaseJob implements OnModuleInit {
  abstract readonly jobName: string // unique identifier, e.g. 'auth.cleanup-tokens'
  readonly defaultCron: string // = '*/5 * * * *' — override to change first-run default
  readonly defaultTimeoutMs: number // = 30_000 — override to change first-run default
  readonly description?: string // stored in scheduled_jobs.description

  abstract run(): Promise<JobResult> // JobResult = Record<string, unknown>

  protected readonly logger: Logger // Pino-backed NestJS logger
}
```

`onModuleInit()` is implemented in `BaseJob` and calls `registry.register(this)`.
Do **not** override it unless you call `super.onModuleInit()`.

---

## Environment variables

| Variable            | Default     | Description                                        |
| ------------------- | ----------- | -------------------------------------------------- |
| `SCHEDULER_ENABLED` | `false`     | Set to `true` in production to activate scheduling |
| `REDIS_HOST`        | `localhost` | Shared with cache module                           |
| `REDIS_PORT`        | `6379`      | Shared with cache module                           |
| `REDIS_PASSWORD`    | —           | Shared with cache module                           |

---

## Multi-instance behaviour

When PM2 runs the API in cluster mode (e.g. 4 workers on a 4-core server), all
workers fire the same cron tick at the same second. Only the first worker to win
the `SET NX` acquires the lock and runs the job. The other three see the lock is
held, log a debug line, and return — no duplicate execution.

This works correctly across multiple **servers** as well, as long as they share
the same Redis instance.

---

## Disabling a job without redeploying

```sql
UPDATE scheduled_jobs SET enabled = false WHERE name = 'todo.archive-old';
```

The change takes effect on the **next PM2 reload** (or restart). The running
instance will continue with its current schedule until then.

To pause immediately, you can also update and then reload:

```bash
pm2 reload api
```

---

## Adding a job checklist

- [ ] Create a class extending `BaseJob` in `src/modules/<name>/application/jobs/`
- [ ] Set `readonly jobName` — must be unique across the entire app
- [ ] Override `defaultCron` and `defaultTimeoutMs` if the defaults are wrong
- [ ] Implement `async run(): Promise<JobResult>`
- [ ] Add the class to the feature module's `providers` array
- [ ] Run `pnpm --filter @workspace/database db:generate && db:migrate` if the
      tables don't exist yet (first time only)
- [ ] Set `SCHEDULER_ENABLED=true` in production `.env`
