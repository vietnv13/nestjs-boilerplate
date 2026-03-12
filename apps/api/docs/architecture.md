# Architecture Overview

## Design goals

- Keep the code easy to read and change (simple modules, SOLID, minimal patterns).
- Reuse infrastructure via workspace packages under `packages/`.
- Return consistent API errors using RFC 9457 Problem Details (`application/problem+json`).

---

## Source tree (high level)

```text
src/
├── main.ts                      # Bootstrap (pipes, filters, Swagger)
├── app.module.ts                # Root module composition
│
├── app/                         # App-specific config only
│   └── config/                  # Env validation (Zod), security/CORS config
│
└── modules/                     # Feature modules
    ├── admin/                   # Admin-only endpoints (SSE, notifications)
    ├── asset/                   # File upload + storage + cleanup
    ├── auth/                    # Auth (JWT, sessions, identities)
    ├── todo/                    # Todo CRUD
    └── user/                    # User CRUD
```

Each feature module follows the layered pattern:

```text
controllers/ (HTTP + DTOs) → service → repositories/ (data access)
```

---

## Reusable infrastructure packages

All reusable HTTP infrastructure lives in workspace packages under `packages/`.
The API app imports from these packages instead of defining them locally.

### `@workspace/nestjs-http` — HTTP infrastructure primitives

Provides all cross-cutting HTTP concerns that can be reused across any NestJS app:

| Export                      | Type         | Purpose                                 |
| --------------------------- | ------------ | --------------------------------------- |
| `CorrelationIdInterceptor`  | Interceptor  | Adds `X-Correlation-Id` response header |
| `DeprecationInterceptor`    | Interceptor  | RFC 8594 Deprecation/Sunset headers     |
| `LinkHeaderInterceptor`     | Interceptor  | RFC 8288 pagination `Link` headers      |
| `LocationHeaderInterceptor` | Interceptor  | RFC 9110 `Location` on 201 responses    |
| `RequestContextInterceptor` | Interceptor  | Adds `X-Request-Id` response header     |
| `TimeoutInterceptor`        | Interceptor  | Request timeout (default 30s)           |
| `TraceContextInterceptor`   | Interceptor  | W3C Trace Context `Trace-Id` header     |
| `ApiVersionMiddleware`      | Middleware   | Date-based API versioning (AIP-185)     |
| `ETagMiddleware`            | Middleware   | RFC 9110 ETag + 304 Not Modified        |
| `createValidationPipe`      | Pipe factory | Standard 422-based validation pipe      |

### Other infrastructure packages

| Package                             | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `@workspace/nestjs-drizzle`         | Drizzle DB module + `DB_TOKEN`                         |
| `@workspace/nestjs-cache`           | cache-manager + `CacheService`                         |
| `@workspace/nestjs-queue`           | Persisted job queue (sync/redis drivers)               |
| `@workspace/nestjs-scheduler`       | Distributed cron scheduler with Redis locks            |
| `@workspace/nestjs-storage`         | Local/S3 storage abstraction                           |
| `@workspace/nestjs-sse`             | SSE hub + pub/sub helpers                              |
| `@workspace/nestjs-health`          | HealthModule, HealthController, DrizzleHealthIndicator |
| `@workspace/nestjs-swagger`         | `setupSwagger()` factory + SwaggerDevController        |
| `@workspace/nestjs-problem-details` | RFC 9457 DTO + global filter                           |
| `@workspace/nestjs-request-context` | CLS config + trace context parsing                     |
| `@workspace/nestjs-logger`          | Pino structured logging                                |

---

## Request pipeline

At startup (`src/main.ts`), the API:

1. Loads config + validation (Zod env schema).
2. Applies global middleware: `ApiVersionMiddleware` → `ETagMiddleware`.
3. Installs global interceptors (ordered): `RequestContextInterceptor` → `CorrelationIdInterceptor` → `TraceContextInterceptor` → `TimeoutInterceptor` → `LocationHeaderInterceptor` → `LinkHeaderInterceptor` → `DeprecationInterceptor`.
4. Installs global validation (`createValidationPipe`) and exception handling (`ProblemDetailsFilter`).
5. Sets up Swagger/Scalar docs.

---

## SOLID principles applied

| Principle                 | How it's applied                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Single Responsibility** | Each interceptor/middleware does one thing; each module owns one domain                                   |
| **Open/Closed**           | New HTTP behaviours are added as new interceptors without touching existing ones                          |
| **Liskov Substitution**   | Repository classes can be swapped behind the service boundary                                             |
| **Interface Segregation** | Packages export only what consumers need; feature modules don't import cross-module internals             |
| **Dependency Inversion**  | Services depend on injected repositories; app depends on package abstractions, not inline implementations |
