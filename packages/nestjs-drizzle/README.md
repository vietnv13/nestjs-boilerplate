# @workspace/nestjs-drizzle

NestJS module for creating a global Drizzle database instance (Postgres) and exposing it via `DB_TOKEN`.

## Usage

1. Import `DrizzleModule` once (usually in `AppModule`):

```ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DrizzleModule } from '@workspace/nestjs-drizzle'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DrizzleModule.forRoot()],
})
export class AppModule {}
```

2. Inject the DB where needed:

```ts
import { Inject, Injectable } from '@nestjs/common'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import type { DrizzleDb } from '@workspace/nestjs-drizzle'

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}
}
```

## Environment variables

- `DATABASE_URL` (required)
- `DB_POOL_MAX`, `DB_POOL_MIN`, `DB_POOL_IDLE_TIMEOUT`, `DB_POOL_CONNECTION_TIMEOUT` (optional)
