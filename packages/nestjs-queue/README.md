# @workspace/nestjs-queue

Background job queue with two interchangeable drivers:

- `sync` (development/testing): runs handlers in-process immediately
- `redis` (production): enqueues to BullMQ, runs handlers asynchronously

Jobs are persisted to the `queue_jobs` table for inspection.

## Usage

Register the module once:

```ts
import { Module } from '@nestjs/common'
import { QueueModule } from '@workspace/nestjs-queue'

@Module({
  imports: [QueueModule.register()],
})
export class AppModule {}
```

Create a handler:

```ts
import { Injectable } from '@nestjs/common'
import { BaseQueueHandler, QueueRegistry } from '@workspace/nestjs-queue'
import type { HandlerResult } from '@workspace/nestjs-queue'

@Injectable()
export class SendWelcomeEmailHandler extends BaseQueueHandler<{ email: string }> {
  readonly jobName = 'send-welcome-email'

  constructor(registry: QueueRegistry) {
    super(registry)
  }

  async handle(payload: { email: string }): Promise<HandlerResult> {
    return { sent: true, email: payload.email }
  }
}
```

Dispatch a job:

```ts
import { Injectable } from '@nestjs/common'
import { QueueService } from '@workspace/nestjs-queue'

@Injectable()
export class UsersService {
  constructor(private readonly queue: QueueService) {}

  async register(email: string) {
    await this.queue.dispatch('send-welcome-email', { email })
  }
}
```

## Graceful shutdown

On deploy, restart, or kill the queue stops cleanly without losing jobs.

**Sync driver** — three shutdown steps:

1. Any new `dispatch()` calls that arrive after shutdown begins are immediately marked `failed` in the DB (no silent loss).
2. Pending **delayed** jobs whose `setTimeout` has not yet fired are cancelled: the timer is cleared and the DB row is marked `failed` with reason `"Job cancelled: server shutdown before delay elapsed"` so the record is not left as an orphaned `pending` row.
3. All **in-flight** executions (`handler.handle()` is running) are awaited via `Promise.allSettled` before the process exits.

**Redis driver (BullMQ)** — handled automatically:

BullMQ's `WorkerHost` calls `worker.close()` in `onModuleDestroy`, which stops accepting new jobs and waits for the currently-processing job to complete. Jobs still `pending` in Redis are safe — they are picked up on the next startup.

**Required in `main.ts`:**

```ts
const app = await NestFactory.create(AppModule)
app.enableShutdownHooks() // ← required for graceful shutdown
await app.listen(3000)
```

Without this, `SIGTERM` (sent by PM2 on restart/stop) kills the process immediately without waiting for in-flight handlers.

## Environment variables

- `QUEUE_DRIVER` (`sync` | `redis`, default `sync`)
- `QUEUE_NAME` (default `default`)
- `QUEUE_CONCURRENCY` (default `5`, redis driver only)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (redis driver only)
