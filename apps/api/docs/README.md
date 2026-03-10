# NestJS Boilerplate API — Documentation

## Contents

| Document                                   | Description                                             |
| ------------------------------------------ | ------------------------------------------------------- |
| [Architecture Overview](./architecture.md) | Layer structure, modules, request pipeline, env vars    |
| [DDD Patterns](./ddd-patterns.md)          | Entities, aggregates, events, CQRS, repositories, sagas |
| [API Usage Examples](./api-usage.md)       | HTTP request/response examples for each endpoint        |
| [Error Codes Reference](./error-codes.md)  | Domain error codes and their HTTP mappings              |
| [Testing Guide](./testing-guide.md)        | Unit, integration (Testcontainers), and E2E testing     |

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

- **CQRS** — `todo` and `users` modules split reads/writes into Query/Command handlers
- **DDD** — domain layer is pure TypeScript with no NestJS or Drizzle imports
- **Application Service** — `auth` uses `AuthService` for complex multi-aggregate workflows
- **RFC 9457 Problem Details** — all errors return `application/problem+json`
- **Event-Driven** — `BaseDomainEvent` + EventBus/EventEmitter2 for decoupled side effects
- **Redis Cache** — `CacheService` wraps `@nestjs/cache-manager` with automatic invalidation
- **Pino Logging** — structured JSON logs with request-scoped correlation IDs

## API Endpoints

| Tag      | Base path    | Description                                |
| -------- | ------------ | ------------------------------------------ |
| `auth`   | `/api/auth`  | Register, login, refresh, logout, sessions |
| `todos`  | `/api/todos` | CRUD for todos                             |
| `users`  | `/api/users` | CRUD for users                             |
| `health` | `/health`    | Liveness / readiness                       |

Interactive API reference: `http://localhost:3000/docs` (Scalar)
Swagger UI: `http://localhost:3000/swagger`
