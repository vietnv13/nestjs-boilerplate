# Notifications (SSE)

This module adds **Server-Sent Events (SSE)** support to push real-time notifications to clients.

## Design

- **Reusable SSE hub**: `SseHubService` is a lightweight in-memory pub/sub that supports:
  - `subscribe(channel)` → `Observable<MessageEvent>`
  - `publish(channel, event)` → number of subscribers delivered
- **Admin implementation (first consumer)**:
  - Clients connect to an SSE stream endpoint.
  - Server publishes test notifications to either the current user channel or a broadcast channel.

Important limitations:

- The hub is **per-process memory**. If you run multiple API instances, events will only reach clients connected to the same instance. For multi-instance production, publish through a shared transport (Redis/NATS/Kafka) and fan out to the hub in each instance.
- The API has a global 30s timeout interceptor; the SSE stream emits a **heartbeat (`ping`) every 15s** to keep the connection alive.

## API (Admin)

Base path is prefixed by `/api`.

### Stream notifications

```http
GET /api/admin/sse/stream
Authorization: Bearer {access_token}
Accept: text/event-stream
```

This endpoint requires an **ADMIN** JWT (same as other `/api/admin/*` endpoints).

Tip: browsers' `EventSource` cannot set `Authorization` headers. Use `fetch()` streaming, or a client library that supports headers.

### Publish a test notification (current admin user)

```http
POST /api/admin/notifications/test
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Weekly report ready",
  "description": "Your weekly analytics report is available"
}
```

**Response**:

```json
{ "transport": "redis", "delivered": 0 }
```

### Publish a test notification (broadcast)

```http
POST /api/admin/notifications/broadcast-test
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "Maintenance window",
  "description": "Planned maintenance starts in 10 minutes"
}
```

**Response**:

```json
{ "transport": "redis", "delivered": 0 }
```

## Reuse in other modules

Inject `SseHubService` and pick a channel naming convention:

- User scoped: `feature.user.{userId}`
- Broadcast: `feature.broadcast`

Then:

- Controller stream: `merge(sseHub.subscribe(...), heartbeat$)`
- Producer: `await sseHub.publish(channel, { type, data })`

## Redis pub/sub (multi-instance)

When Redis is available, SSE events are published via Redis channels (prefix `sse.`) and bridged back into local connected clients. If Redis is unavailable, the publisher falls back to in-memory delivery for that instance only.
