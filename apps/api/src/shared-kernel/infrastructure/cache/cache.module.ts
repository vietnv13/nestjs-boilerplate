import { createKeyv } from "@keyv/redis";
import { CacheModule as NestCacheModule } from "@nestjs/cache-manager";
import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Keyv from "keyv";

import { CacheService } from "./cache.service";

import type { Env } from "@/app/config/env.schema";

/**
 * Cache module
 *
 * Provides a global caching layer using @nestjs/cache-manager.
 * Uses Redis when REDIS_HOST is configured, falls back to in-memory.
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => {
        const host = configService.get("REDIS_HOST", { infer: true });
        const port = configService.get("REDIS_PORT", { infer: true });
        const password = configService.get("REDIS_PASSWORD", { infer: true });
        const ttl = configService.get("REDIS_TTL", { infer: true }) * 1000; // ms

        const redisUrl = password
          ? `redis://:${password}@${host}:${port}`
          : `redis://${host}:${port}`;

        const store = createKeyv(redisUrl, { namespace: "api" });

        return {
          stores: [new Keyv({ store, ttl })],
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
