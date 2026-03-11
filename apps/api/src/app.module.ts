import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { ClsModule } from 'nestjs-cls'

import { validateEnv } from '@/app/config/env.schema'
import { throttlerConfig } from '@/app/config/security.config'
import { HealthModule } from '@/app/health/health.module'
import { CorrelationIdInterceptor } from '@/app/interceptors/correlation-id.interceptor'
import { DeprecationInterceptor } from '@/app/interceptors/deprecation.interceptor'
import { RequestContextInterceptor } from '@/app/interceptors/request-context.interceptor'
import { TraceContextInterceptor } from '@/app/interceptors/trace-context.interceptor'
import { ApiVersionMiddleware } from '@/app/middleware/api-version.middleware'
import { ETagMiddleware } from '@/app/middleware/etag.middleware'
import { SwaggerDevController } from '@/app/swagger/swagger-dev.controller'
import { AdminModule } from '@/modules/admin/admin.module'
import { AssetModule } from '@/modules/asset/asset.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { TodoModule } from '@/modules/todo/todo.module'
import { UserModule } from '@/modules/user/user.module'
import { CacheModule } from '@workspace/nestjs-cache'
import { DrizzleModule } from '@workspace/nestjs-drizzle'
import { QueueModule } from '@workspace/nestjs-queue'
import { SchedulerModule } from '@workspace/nestjs-scheduler'
import { StorageModule } from '@workspace/nestjs-storage'
import { LoggerModule } from '@workspace/nestjs-logger'
import { ProblemDetailsFilter } from '@workspace/nestjs-problem-details'
import { createClsConfig } from '@workspace/nestjs-request-context'

import type { NestModule, MiddlewareConsumer } from '@nestjs/common'

/**
 * Root module: assembles all feature modules and infrastructure
 *
 * Architecture:
 * - Modular Layered Architecture
 * - Dependency Inversion Principle (DIP)
 */
@Module({
  imports: [
    // Config module: global environment variable management
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available app-wide
      validate: validateEnv, // Validate env vars with Zod
      cache: true, // Cache env vars for performance
    }),
    // CLS module: request context management (Request ID, tracing, etc.)
    ClsModule.forRoot(createClsConfig()),
    // Logger module: high-performance structured logging (Pino)
    LoggerModule,
    // Database module: global Drizzle instance
    DrizzleModule.forRoot(),
    // Cache module: caching infrastructure
    CacheModule,
    // Storage module: local/S3 file storage
    StorageModule,
    // Scheduler module: distributed cron jobs with Redis locking
    SchedulerModule,
    // Rate limiting module: prevent API abuse
    ThrottlerModule.forRoot([
      {
        ttl: throttlerConfig.ttl,
        limit: throttlerConfig.limit,
      },
    ]),
    HealthModule, // Health check module
    // Business modules
    UserModule,
    TodoModule,
    AuthModule,
    AdminModule, // Admin module (admin-only endpoints)
    AssetModule, // Asset module (file upload + linking + cleanup)
    QueueModule.register(), // Queue module (sync / redis driver)
  ],
  controllers: [
    // Dev helper controller (dev only)
    ...(process.env.NODE_ENV === 'production' ? [] : [SwaggerDevController]),
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ProblemDetailsFilter,
    // Interceptors (require ClsService injection)
    RequestContextInterceptor,
    CorrelationIdInterceptor,
    TraceContextInterceptor,
    DeprecationInterceptor,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Register global middleware
    consumer
      .apply(
        ApiVersionMiddleware, // API versioning (must be before ETag)
        ETagMiddleware, // ETag and 304 Not Modified support
      )
      .forRoutes('*path') // Apply to all routes (NestJS 11 / Express 5 named wildcard)
  }
}
