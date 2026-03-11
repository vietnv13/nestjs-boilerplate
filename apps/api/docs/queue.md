# Queue System

Background job processing with two interchangeable drivers: **sync** (development, testing) and **redis** (production).

Every dispatched job is persisted to the `queue_jobs` table so you can inspect status, payload, result, and error at any time.

---

## Architecture

```
QueueService.dispatch()
    │
    ├─ creates queue_jobs row (status=pending)
    │
    └─ delegates to IQueueDriver
           │
           ├─ SyncQueueDriver  – runs handler immediately, same process
           └─ RedisQueueDriver – enqueues to BullMQ, worker runs async
```

---

## Configuration

| Variable            | Default     | Description                            |
| ------------------- | ----------- | -------------------------------------- |
| `QUEUE_DRIVER`      | `sync`      | `sync` or `redis`                      |
| `QUEUE_NAME`        | `default`   | Logical queue name                     |
| `QUEUE_CONCURRENCY` | `5`         | Worker concurrency (redis driver only) |
| `REDIS_HOST`        | `localhost` | Redis host (redis driver)              |
| `REDIS_PORT`        | `6379`      | Redis port (redis driver)              |
| `REDIS_PASSWORD`    | —           | Redis password (redis driver)          |

**.env examples**

```dotenv
# Sync (default, no Redis needed)
QUEUE_DRIVER=sync

# Redis (production)
QUEUE_DRIVER=redis
QUEUE_NAME=default
QUEUE_CONCURRENCY=10
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## Database Migration

After updating the schema, generate and apply the migration:

```bash
pnpm --filter @workspace/database drizzle-kit generate
pnpm --filter @workspace/database drizzle-kit migrate
```

The migration adds the `queue_jobs` table with these columns:

| Column         | Type        | Description                                                     |
| -------------- | ----------- | --------------------------------------------------------------- |
| `id`           | uuid        | Primary key                                                     |
| `name`         | varchar     | Handler name                                                    |
| `queue`        | varchar     | Logical queue                                                   |
| `payload`      | jsonb       | Input data                                                      |
| `status`       | text        | `pending` / `processing` / `completed` / `failed` / `cancelled` |
| `attempts`     | int         | Execution attempts made                                         |
| `max_attempts` | int         | Maximum allowed attempts                                        |
| `priority`     | int         | Higher = processed first (redis)                                |
| `delay_ms`     | int         | Requested delay in ms                                           |
| `started_at`   | timestamptz | When processing began                                           |
| `finished_at`  | timestamptz | When processing ended                                           |
| `duration_ms`  | int         | Wall-clock execution time                                       |
| `result`       | jsonb       | Return value on success                                         |
| `error`        | text        | Error message on failure                                        |
| `error_stack`  | text        | Stack trace on failure                                          |
| `instance_id`  | varchar     | Worker hostname:pid                                             |
| `external_id`  | varchar     | BullMQ job ID (redis driver)                                    |
| `created_at`   | timestamptz | Row creation time                                               |
| `updated_at`   | timestamptz | Last update time                                                |

---

## Creating a Handler

Extend `BaseQueueHandler` and add it to the `providers` array of any feature module.

```ts
// features/notification/jobs/send-welcome-email.handler.ts
import { Injectable } from '@nestjs/common'
import { BaseQueueHandler, QueueRegistry } from '@workspace/nestjs-queue'
import type { HandlerResult } from '@workspace/nestjs-queue'

interface Payload {
  userId: string
  email: string
}

@Injectable()
export class SendWelcomeEmailHandler extends BaseQueueHandler<Payload> {
  readonly jobName = 'send-welcome-email'

  constructor(
    private readonly mailer: MailerService,
    registry: QueueRegistry, // must be the last arg passed to super()
  ) {
    super(registry)
  }

  async handle(payload: Payload): Promise<HandlerResult> {
    await this.mailer.sendWelcome(payload.email)
    return { sent: true, userId: payload.userId }
  }
}
```

Register it in the feature module:

```ts
// notification.module.ts
@Module({
  providers: [
    NotificationService,
    SendWelcomeEmailHandler, // ← add the handler here
  ],
})
export class NotificationModule {}
```

> **No import of `QueueModule` needed** — it is `@Global()` and registered once in `AppModule`.

---

## Dispatching a Job

Inject `QueueService` anywhere and call `dispatch()`:

```ts
import { QueueService } from '@workspace/nestjs-queue'

@Injectable()
export class UserService {
  constructor(private readonly queue: QueueService) {}

  async register(email: string) {
    const user = await this.userRepo.create(email)

    // Fire-and-forget
    await this.queue.dispatch('send-welcome-email', {
      userId: user.id,
      email: user.email,
    })

    return user
  }
}
```

### Dispatch options

```ts
await this.queue.dispatch(
  'resize-image',
  { assetId: 'abc' },
  {
    delay: 10_000, // run 10 s from now
    maxAttempts: 3, // retry up to 3 times on failure
    priority: 5, // higher priority (redis driver only)
    queue: 'images', // override the default queue name
    jobId: 'dedup-key', // idempotency key (redis: no duplicate while pending)
  },
)
```

### Tracking a job

```ts
const job = await this.queue.dispatch('send-welcome-email', payload)
console.log(job.id, job.status) // 'pending' | 'processing' | 'completed' | 'failed'

// Later — re-fetch from DB
const updated = await this.queue.find(job.id)
console.log(updated?.result, updated?.error)
```

### Cancelling a job

```ts
await this.queue.cancel(job.id)
// Only works while status is still 'pending'
```

---

## Driver Comparison

| Feature                                  | sync                     | redis                       |
| ---------------------------------------- | ------------------------ | --------------------------- |
| Requires Redis                           | No                       | Yes                         |
| Handler runs before `dispatch()` returns | Yes (unless `delay > 0`) | No                          |
| Retries                                  | Synchronous (inline)     | BullMQ automatic            |
| Concurrency                              | Sequential               | `QUEUE_CONCURRENCY` workers |
| Delayed jobs                             | `setTimeout`             | BullMQ native               |
| Priority                                 | Ignored                  | Supported                   |
| Survives process restart                 | No                       | Yes (jobs stay in Redis)    |
| Recommended for                          | Dev / tests              | Staging / production        |

---

## Example: Email + Image resize in the same module

```ts
// assets.module.ts
@Module({
  providers: [
    AssetService,
    ResizeImageHandler, // handles 'resize-image'
    GenerateThumbnailHandler, // handles 'generate-thumbnail'
  ],
})
export class AssetsModule {}
```

```ts
// asset.service.ts
async uploadImage(buffer: Buffer) {
  const asset = await this.repo.save(buffer)

  // High-priority resize runs first
  await this.queue.dispatch('resize-image', { assetId: asset.id }, { priority: 10 })

  // Low-priority thumbnail delayed 30 s
  await this.queue.dispatch('generate-thumbnail', { assetId: asset.id }, {
    delay: 30_000,
    priority: 1,
    maxAttempts: 5,
  })

  return asset
}
```
