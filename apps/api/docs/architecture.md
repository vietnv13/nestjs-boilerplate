# Architecture Overview

## Design Philosophy

The API follows **Domain-Driven Design (DDD)** with **Clean Architecture** layering. Each
business capability lives in its own module with a strict, inward-pointing dependency rule:

```
Presentation → Application → Domain ← Infrastructure
```

The **domain layer** never imports from infrastructure or presentation. Infrastructure adapters
implement domain-defined ports (interfaces). This keeps business rules framework-agnostic and
fully testable.

---

## Source Tree

```
src/
├── main.ts                      # Bootstrap (guards, filters, interceptors)
├── app.module.ts                # Root module composition
├── metadata.ts                  # Auto-generated Swagger plugin metadata
│
├── app/                         # Cross-cutting HTTP infrastructure
│   ├── config/                  # Env validation (Zod), CORS, throttler, CLS, Swagger
│   ├── filters/                 # Global exception → RFC 9457 Problem Details
│   ├── health/                  # Health-check controller + Drizzle indicator
│   ├── interceptors/            # Correlation-ID, timeout, ETag, deprecation, transform
│   ├── logger/                  # Pino structured logging
│   ├── middleware/              # API-Version header, ETag caching
│   └── swagger/                 # Dev-only Swagger credential endpoint
│
├── modules/                     # Business bounded contexts
│   ├── auth/                    # Authentication (AuthService + Passport JWT)
│   ├── todo/                    # Todo management (CQRS)
│   └── users/                   # User management (CQRS)
│
└── shared-kernel/               # Shared primitives (no business logic)
    ├── application/ports/       # Cross-module repository contracts
    ├── domain/                  # Base classes, exceptions, value objects
    └── infrastructure/          # DB, cache, events, guards, decorators, DTOs
```

---

## Module Layer Structure

Every module follows the same four-layer layout:

```
modules/<name>/
├── domain/              # Business objects, events — no framework imports
│   ├── aggregates/      # Aggregate roots (extend BaseAggregateRoot)
│   ├── entities/        # Non-root entities with identity
│   ├── events/          # Domain events (extend BaseDomainEvent)
│   └── value-objects/   # Immutable domain primitives
├── application/         # Use-case orchestration
│   ├── commands/        # Write use cases: Command + @CommandHandler
│   ├── queries/         # Read use cases: Query + @QueryHandler
│   ├── ports/           # Repository / service interfaces (DIP)
│   └── services/        # Multi-step orchestration (e.g., AuthService)
├── infrastructure/      # Adapter implementations (Drizzle, bcrypt, …)
│   ├── repositories/    # Implements domain ports
│   ├── services/        # Implements service ports
│   └── strategies/      # Passport strategies
└── presentation/        # HTTP surface
    ├── controllers/     # Route handlers — delegate to CommandBus / QueryBus
    ├── dtos/            # Request / response shapes (class-validator)
    └── guards/          # Route-level guards
```

---

## Modules in Detail

### `auth` — Authentication

Uses **AuthService** (application service pattern) rather than individual CQRS handlers,
because authentication workflows span multiple aggregates and require transactional
coordination that is cleaner expressed as a single service.

| Layer          | Key files                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Domain         | `AuthIdentity` aggregate (accounts), `AuthSession` entity, `AuthProvider` VO                                             |
| Application    | `AuthService` (register, login, refresh, logout, session management)                                                     |
| Ports          | `AuthIdentityRepository`, `AuthSessionRepository`, `PasswordHasher`, `UserRoleRepository`, `VerificationTokenRepository` |
| Infrastructure | `AuthIdentityRepositoryImpl` (Drizzle/accounts table), `BcryptPasswordHasher`, `JwtStrategy`                             |
| Presentation   | `AuthController` (v1), `AuthV2Controller` (v2), `JwtAuthGuard`                                                           |

**Auth flow (login):**

1. `AuthController` receives `POST /auth/login` with email + password.
2. Delegates to `AuthService.login()`.
3. Service finds `AuthIdentity` by provider=`email` and accountId=email address.
4. Verifies password via `PasswordHasher.verify()`.
5. Issues access JWT + refresh JWT; persists `AuthSession` via `AuthSessionRepository`.
6. Returns `{ user, accessToken, refreshToken }`.

### `users` — User Management (CQRS)

Full CQRS pattern. Controllers dispatch commands/queries through `CommandBus`/`QueryBus`.
The repository implementation includes Redis caching for reads.

| Commands            | Queries               |
| ------------------- | --------------------- |
| `CreateUserCommand` | `GetUserByIdQuery`    |
| `UpdateUserCommand` | `GetUserByEmailQuery` |
| `DeleteUserCommand` | `GetAllUsersQuery`    |

Domain events published by handlers: `UserCreatedEvent`, `UserUpdatedEvent`, `UserDeletedEvent`.

### `todo` — Todo Management (CQRS)

Same CQRS pattern as users. No caching at the repository layer (todos change frequently).

| Commands            | Queries            |
| ------------------- | ------------------ |
| `CreateTodoCommand` | `GetTodoByIdQuery` |
| `UpdateTodoCommand` | `GetAllTodosQuery` |
| `DeleteTodoCommand` |                    |

Domain events: `TodoCreatedEvent`, `TodoUpdatedEvent`, `TodoCompletedEvent`, `TodoDeletedEvent`.

---

## Shared Kernel

### `shared-kernel/domain/`

Pure TypeScript — zero NestJS imports.

| File                       | Purpose                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| `base-aggregate-root.ts`   | Collects `BaseDomainEvent` instances; cleared after publishing            |
| `base-domain-event.ts`     | Event base: `aggregateId`, `occurredAt`, abstract `eventType`             |
| `exceptions/`              | `DomainException` hierarchy mapped to HTTP status codes (400/404/409/422) |
| `value-objects/role.vo.ts` | `RoleType` type + `ROLES` constants used by auth                          |

### `shared-kernel/application/ports/`

Cross-module repository contracts used by the auth module to access core user data.

| Port                      | Consumer                                            |
| ------------------------- | --------------------------------------------------- |
| `user.repository.port.ts` | `AuthModule` — create/findById/setBanned/hardDelete |

### `shared-kernel/infrastructure/`

| Sub-directory | What it provides                                                                    |
| ------------- | ----------------------------------------------------------------------------------- |
| `db/`         | `DrizzleModule.forRoot()` — global DB token (`DB_TOKEN`) with connection pool       |
| `cache/`      | `CacheModule` (global) — `CacheService` wrapping `@nestjs/cache-manager` + Redis    |
| `events/`     | `DomainEventPublisher`, `EventStoreService`, `EventStorePublisher`, Sagas           |
| `guards/`     | `JwtAuthGuard` (re-exported barrel)                                                 |
| `decorators/` | `@Api*Response` Swagger helpers, `@UseEnvelope`                                     |
| `dtos/`       | `ProblemDetailsDto`, pagination DTOs (`OffsetPaginationDto`, `CursorPaginationDto`) |
| `types/`      | `ValidationErrorItem`                                                               |
| `utils/`      | W3C Trace Context parsing/generation                                                |

---

## CQRS Pattern (Todo & Users)

```
HTTP Request
     │
     ▼
Controller
     │  new CreateTodoCommand(title, description)
     ▼
CommandBus.execute(command)
     │
     ▼
CreateTodoHandler.execute(command)
     │  todoRepository.create(...)
     │  eventBus.publish(new TodoCreatedEvent(...))
     ▼
Returns Todo
```

All handlers are registered in the module's `providers` array. Each module imports its
own `CqrsModule` instance.

---

## Domain Event System

Two complementary mechanisms coexist:

### 1. CQRS `EventBus` (`@nestjs/cqrs`)

Used by `Todo` and `Users` handlers. Events dispatched with:

```typescript
this.eventBus.publish(new UserCreatedEvent(user.id, user.email, user.name));
```

**Sagas** subscribe to the bus via `@Saga()` and react to events by dispatching follow-up
commands (currently logs stubs — extend for real workflows):

- `UserRegistrationSaga` → reacts to `UserCreatedEvent`
- `TodoCompletionSaga` → reacts to `TodoCompletedEvent`

**`EventStorePublisher`** also subscribes to persist every event in `EventStoreService`
(in-memory dev store; replace with EventStoreDB / PostgreSQL JSONB in production).

### 2. `EventEmitter2` (`@nestjs/event-emitter`)

Used by `DomainEventPublisher` to emit events collected from **aggregate roots** after a
state mutation. Consumers use `@OnEvent('user.created')`.

```typescript
// After mutating an aggregate root:
await this.domainEventPublisher.publishEventsForAggregate(aggregate);
```

---

## Cache Layer

`CacheModule` (global) wraps `@nestjs/cache-manager` with a `@keyv/redis` store.

```typescript
// Repository reads cached via CacheService:
return this.cacheService.getOrSet(
  CacheKeyGenerator.user(id),        // "user:<id>"
  () => this.db.select()...          // factory called on cache miss
);
```

`CacheKeyGenerator` centralises all key strings to prevent collisions.
Invalidation happens explicitly on `update` and `delete`.

---

## Exception Handling

All errors produce **RFC 9457 Problem Details** (`application/problem+json`):

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Todo with ID abc was not found",
  "instance": "/api/todos/abc",
  "request_id": "req_xyz",
  "timestamp": "2026-03-10T10:00:00Z"
}
```

Four global filters, applied most-specific first:

| Filter                     | Catches                           |
| -------------------------- | --------------------------------- |
| `DomainExceptionFilter`    | `DomainException` subclasses      |
| `ThrottlerExceptionFilter` | `ThrottlerException` (rate limit) |
| `ProblemDetailsFilter`     | NestJS `HttpException`            |
| `AllExceptionsFilter`      | Everything else                   |

---

## HTTP Request Pipeline

```
Request
  ↓ ETagMiddleware             (304 Not Modified if ETag matches)
  ↓ ApiVersionMiddleware       (reads API-Version header)
  ↓ ThrottlerGuard             (rate limiting — 100 req / 60 s default)
  ↓ RequestContextInterceptor  (attach requestId to CLS store)
  ↓ CorrelationIdInterceptor   (X-Correlation-ID header)
  ↓ TraceContextInterceptor    (W3C traceparent)
  ↓ TimeoutInterceptor         (30 s hard timeout)
  ↓ LocationHeaderInterceptor  (201 Created → Location)
  ↓ LinkHeaderInterceptor      (pagination Link header)
  ↓ DeprecationInterceptor     (Deprecation header)
  ↓ TransformInterceptor       (envelope wrap if @UseEnvelope)
  ↓ Controller handler
  ↑ Exception filters (error path)
```

---

## Environment Variables

All validated at startup by `src/app/config/env.schema.ts` (Zod). Sensible defaults
allow running locally without a `.env` file.

| Variable                 | Default                                | Description             |
| ------------------------ | -------------------------------------- | ----------------------- |
| `DATABASE_URL`           | `postgres://localhost:5432/vsa_m_nest` | PostgreSQL connection   |
| `JWT_SECRET`             | (change in prod)                       | HS256 key, min 32 chars |
| `JWT_EXPIRES_IN`         | `15m`                                  | Access token TTL        |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                   | Refresh token TTL       |
| `REDIS_HOST`             | `localhost`                            | Redis host              |
| `REDIS_PORT`             | `6379`                                 | Redis port              |
| `REDIS_TTL`              | `3600`                                 | Cache TTL (seconds)     |
| `PORT`                   | `3000`                                 | HTTP port               |

---

## Adding a New Module

1. Create `src/modules/<name>/`.
2. Define domain objects in `domain/` (entities, events extending `BaseDomainEvent`).
3. Define the repository interface + injection token in `application/ports/`.
4. Implement the repository in `infrastructure/repositories/` using Drizzle.
5. Write CQRS handlers in `application/commands/` and `application/queries/`.
6. Add the controller + DTOs in `presentation/`.
7. Register everything in `<name>.module.ts` and add the module to `app.module.ts`.
