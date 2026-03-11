# Architecture Overview

## Design goals

- Keep the code easy to read and change (simple modules, SOLID, minimal patterns).
- Reuse infrastructure via workspace packages under `packages/`.
- Return consistent API errors using RFC 9457 Problem Details (`application/problem+json`).

---

## Source tree (high level)

```
src/
├── main.ts                      # Bootstrap (pipes, filters, Swagger)
├── app.module.ts                # Root module composition
│
├── app/                         # Cross-cutting HTTP infrastructure
│   ├── config/                  # Env validation, Swagger, etc.
│   ├── filters/                 # Global exception handling
│   ├── health/                  # Health checks
│   ├── logger/                  # Pino logging setup
│   └── middleware/              # HTTP middleware (ETag, versioning, ...)
│
└── modules/                     # Feature modules
    ├── auth/                    # Auth (JWT, sessions)
    ├── todo/                    # Todo CRUD
    └── user/                    # User CRUD
```

Each feature module typically follows:

```
presentation/ (controllers + dtos) → service → infrastructure/ (repositories)
```

---

## Reusable infrastructure packages

The API imports infrastructure from workspace packages (examples):

- `@workspace/nestjs-drizzle` — Drizzle DB module + `DB_TOKEN`
- `@workspace/nestjs-cache` — cache-manager + `CacheService`
- `@workspace/nestjs-queue` — persisted job queue (sync/redis drivers)
- `@workspace/nestjs-scheduler` — distributed cron scheduler with Redis locks
- `@workspace/nestjs-storage` — local/S3 storage abstraction
- `@workspace/nestjs-sse` — SSE hub + pub/sub helpers
- `@workspace/nestjs-problem-details` — RFC 9457 DTO + global filter
- `@workspace/nestjs-request-context` — CLS config + trace context parsing

---

## Request pipeline

At startup (`src/main.ts`), the API:

1. Loads config + validation.
2. Installs global validation (DTOs) and exception handling (Problem Details).
3. Sets up Swagger/Scalar docs in development.

