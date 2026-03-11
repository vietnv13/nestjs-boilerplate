# NestJS Boilerplate API — Documentation

## Contents

| Document                                         | Description                                             |
| ------------------------------------------------ | ------------------------------------------------------- |
| [Architecture Overview](./architecture.md)       | Layer structure, modules, request pipeline, env vars    |
| [API Usage Examples](./api-usage.md)             | HTTP request/response examples for each endpoint        |
| [Error Codes Reference](./error-codes.md)        | Domain error codes and their HTTP mappings              |
| [Storage](./storage.md)                          | Local/S3 file uploads                                   |
| [Notifications (SSE)](./notifications-sse.md)    | Real-time notifications via Server-Sent Events          |
| [Testing Guide](./testing-guide.md)              | Unit, integration (Testcontainers), and E2E testing     |
| [Production Error Checking](./error-checking.md) | How to check for errors in production                   |

## Quick Start

```bash
# Install dependencies
pnpm install

# Run in development (watch mode)
pnpm --filter api dev

# Build for production
pnpm --filter api build

# Run tests
pnpm --filter api test

# Run integration tests (requires Docker)
pnpm --filter api test:integration
```

## Key Concepts

- **Feature modules** — controllers call services; services use repositories (simple, SOLID)
- **RFC 9457 Problem Details** — all errors return `application/problem+json`
- **Reusable packages** — cache/queue/scheduler/storage are workspace packages under `packages/`
- **Redis cache** — `CacheService` wraps `@nestjs/cache-manager` with automatic invalidation
- **Pino Logging** — structured JSON logs with request-scoped correlation IDs

## API Endpoints

| Tag      | Base path    | Description                                |
| -------- | ------------ | ------------------------------------------ |
| `auth`   | `/api/auth`  | Register, login, refresh, logout, sessions |
| `todos`  | `/api/todos` | CRUD for todos                             |
| `user`   | `/api/users` | CRUD for users                             |
| `health` | `/health`    | Liveness / readiness                       |

Interactive API reference: `http://localhost:3000/docs` (Scalar)
Swagger UI: `http://localhost:3000/swagger`
