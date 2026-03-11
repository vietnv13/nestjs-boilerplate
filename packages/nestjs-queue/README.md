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

## Environment variables

- `QUEUE_DRIVER` (`sync` | `redis`, default `sync`)
- `QUEUE_NAME` (default `default`)
- `QUEUE_CONCURRENCY` (default `5`, redis driver only)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (redis driver only)
