# @workspace/nestjs-cache

Global cache module built on `@nestjs/cache-manager`, using Redis when configured and falling back to in-memory cache otherwise.

## Usage

```ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CacheModule } from '@workspace/nestjs-cache'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), CacheModule],
})
export class AppModule {}
```

Inject `CacheService`:

```ts
import { Injectable } from '@nestjs/common'
import { CacheService } from '@workspace/nestjs-cache'

@Injectable()
export class UsersService {
  constructor(private readonly cache: CacheService) {}
}
```

## Environment variables

- `REDIS_HOST` (optional; when set, Redis is used)
- `REDIS_PORT` (default `6379`)
- `REDIS_PASSWORD` (optional)
- `REDIS_TTL` (default `60`, seconds)
