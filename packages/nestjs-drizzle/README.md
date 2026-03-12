# @workspace/nestjs-drizzle

NestJS global module for [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL (`node-postgres`).
Provides a single, fully-typed `DrizzleDb` instance via `DB_TOKEN` across your entire application.

---

## Quick start

### 1. Register in `AppModule`

```ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DrizzleModule } from '@workspace/nestjs-drizzle'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // must be registered before DrizzleModule
    DrizzleModule.forRoot(),                   // reads env vars automatically
  ],
})
export class AppModule {}
```

### 2. Inject the database

```ts
import { Inject, Injectable } from '@nestjs/common'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import { usersTable } from '@workspace/database'
import { eq } from 'drizzle-orm'

import type { DrizzleDb } from '@workspace/nestjs-drizzle'

@Injectable()
export class UserRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

  findById(id: string) {
    return this.db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1)
  }
}
```

---

## Registration options

### `forRoot()` — env-based (recommended)

Reads configuration directly from `ConfigService`. No extra setup needed.

```ts
DrizzleModule.forRoot()
```

Required env var: `DATABASE_URL`
Optional env vars: `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_IDLE_TIMEOUT`, `DB_POOL_CONNECTION_TIMEOUT`

### `forRootAsync()` — custom factory

Use when connection options come from a non-standard source (e.g. Vault, dynamic config).

```ts
DrizzleModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    connectionString: config.getOrThrow('DATABASE_URL'),
    pool: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 60_000,
      connectionTimeoutMillis: 10_000,
    },
  }),
})
```

---

## Environment variables

| Variable                     | Required | Default | Description                              |
| ---------------------------- | -------- | ------- | ---------------------------------------- |
| `DATABASE_URL`               | yes      | —       | Full PostgreSQL connection string        |
| `DB_POOL_MAX`                | no       | `10`    | Max pool connections                     |
| `DB_POOL_MIN`                | no       | `2`     | Min pool connections kept alive          |
| `DB_POOL_IDLE_TIMEOUT`       | no       | `30000` | Idle connection timeout (ms)             |
| `DB_POOL_CONNECTION_TIMEOUT` | no       | `5000`  | Connection acquisition timeout (ms)      |

---

## Repository pattern

Group all database access in a `*Repository` class. Inject `DB_TOKEN` and use Drizzle's typed query builder.

```ts
import { Inject, Injectable } from '@nestjs/common'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import { todosTable } from '@workspace/database'
import { and, eq, isNull } from 'drizzle-orm'

import type { DrizzleDb } from '@workspace/nestjs-drizzle'
import type { TodoDatabase } from '@workspace/database'

@Injectable()
export class TodoRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

  findAll(userId: string): Promise<TodoDatabase[]> {
    return this.db
      .select()
      .from(todosTable)
      .where(and(eq(todosTable.userId, userId), isNull(todosTable.deletedAt)))
  }

  async create(data: { userId: string; title: string }): Promise<TodoDatabase> {
    const [todo] = await this.db.insert(todosTable).values(data).returning()
    return todo!
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(todosTable).where(eq(todosTable.id, id))
    return (result.rowCount ?? 0) > 0
  }
}
```

---

## Health check

Use `DrizzleHealthIndicator` from `@workspace/nestjs-health` to add a `/health` endpoint that verifies the DB connection:

```ts
import { Module } from '@nestjs/common'
import { HealthModule } from '@workspace/nestjs-health'

@Module({
  imports: [HealthModule], // exposes GET /health, /health/ready, /health/live
})
export class AppModule {}
```

---

## Exports reference

| Export                 | Kind        | Description                                       |
| ---------------------- | ----------- | ------------------------------------------------- |
| `DB_TOKEN`             | `Symbol`    | DI injection token for the Drizzle instance       |
| `DrizzleDb`            | `type`      | Fully-typed `NodePgDatabase<Schema>`              |
| `Schema`               | `type`      | Full schema type (`typeof schema`)                |
| `DrizzleModule`        | `class`     | NestJS global module (`forRoot` / `forRootAsync`) |
| `DrizzleModuleOptions` | `interface` | `connectionString` + optional `pool`              |
| `DrizzlePoolOptions`   | `interface` | Pool tuning knobs                                 |
| `DrizzleAsyncOptions`  | `interface` | `useFactory` pattern for `forRootAsync`           |

---

## SOLID design notes

| Principle | Applied |
| --- | --- |
| **Single Responsibility** | Each file has one job: token, types, factory, and module wiring are all separate |
| **Open/Closed** | `forRootAsync` lets you swap any config source without modifying the module |
| **Interface Segregation** | `DrizzlePoolOptions` is separate from `DrizzleModuleOptions` — import only what you need |
| **Dependency Inversion** | Consumers inject `DB_TOKEN` (abstraction) — never `Pool` or Drizzle internals directly |
