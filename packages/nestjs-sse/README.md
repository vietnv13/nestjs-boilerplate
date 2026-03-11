# @workspace/nestjs-sse

Server-Sent Events (SSE) hub for NestJS with optional Redis pub/sub fanout.

## Usage

```ts
import { Module } from '@nestjs/common'
import { SseModule } from '@workspace/nestjs-sse'

@Module({
  imports: [SseModule],
})
export class AppModule {}
```

Inject `SseHubService` to broadcast events to connected clients.

## Environment variables

When using Redis pub/sub:

- `REDIS_HOST` (required)
- `REDIS_PORT` (default `6379`)
- `REDIS_PASSWORD` (optional)
