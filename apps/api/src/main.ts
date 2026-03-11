import { RequestMethod } from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import { Logger } from 'nestjs-pino'

import { corsConfig } from '@/app/config/security.config'
import { setupSwagger } from '@/app/config/swagger.config'
import { createValidationPipe } from '@/app/config/validation.config'
import { AllExceptionsFilter } from '@/app/filters/all-exceptions.filter'
import { DomainExceptionFilter } from '@/app/filters/domain-exception.filter'
import { ProblemDetailsFilter } from '@/app/filters/problem-details.filter'
import { ThrottlerExceptionFilter } from '@/app/filters/throttler-exception.filter'
import { CorrelationIdInterceptor } from '@/app/interceptors/correlation-id.interceptor'
import { DeprecationInterceptor } from '@/app/interceptors/deprecation.interceptor'
import { LinkHeaderInterceptor } from '@/app/interceptors/link-header.interceptor'
import { LocationHeaderInterceptor } from '@/app/interceptors/location-header.interceptor'
import { RequestContextInterceptor } from '@/app/interceptors/request-context.interceptor'
import { TimeoutInterceptor } from '@/app/interceptors/timeout.interceptor'
import { TraceContextInterceptor } from '@/app/interceptors/trace-context.interceptor'
import { TransformInterceptor } from '@/app/interceptors/transform.interceptor'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })

  app.useLogger(app.get(Logger))

  app.enableCors(corsConfig)

  app.setGlobalPrefix('api', {
    exclude: [
      // Exclude Swagger dev credentials endpoint
      { path: '.well-known', method: RequestMethod.ALL },
      { path: '.well-known/*path', method: RequestMethod.ALL },
      // Exclude health check endpoints
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/*path', method: RequestMethod.ALL },
    ],
  })

  // Global exception filters (specific to general)
  // Order matters: most specific first, most general last
  app.useGlobalFilters(
    app.get(DomainExceptionFilter), // Domain exceptions (most specific)
    app.get(ThrottlerExceptionFilter), // Rate limiting
    app.get(ProblemDetailsFilter), // HTTP exceptions
    app.get(AllExceptionsFilter), // Catch-all (most general)
  )

  // Global interceptors — order determines execution sequence
  app.useGlobalInterceptors(
    app.get(RequestContextInterceptor),
    app.get(CorrelationIdInterceptor),
    app.get(TraceContextInterceptor),
    new TimeoutInterceptor(30_000),
    new LocationHeaderInterceptor(),
    new LinkHeaderInterceptor(),
    app.get(DeprecationInterceptor),
    new TransformInterceptor(app.get(Reflector)),
  )

  app.useGlobalPipes(createValidationPipe())

  await setupSwagger(app)

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  const logger = app.get(Logger)
  const env = process.env.NODE_ENV ?? 'development'
  const nodeVersion = process.version
  const baseUrl = `http://localhost:${port}`

  const startupMessage = `
┌─────────────────────────────────────────────────────┐
│              NestJS Boilerplate Server              │
├─────────────────────────────────────────────────────┤
│  Environment:  ${env.padEnd(35)}  │
│  Port:         ${String(port).padEnd(35)}  │
│  Node:         ${nodeVersion.padEnd(35)}  │
├─────────────────────────────────────────────────────┤
│  Endpoints:                                         │
│  - App:        ${baseUrl.padEnd(35)}  │
│  - Docs:       ${`${baseUrl}/docs`.padEnd(35)}  │
│  - Swagger:    ${`${baseUrl}/swagger`.padEnd(35)}  │
│  - YAML:       ${`${baseUrl}/openapi.yaml`.padEnd(35)}  │
│  - Health:     ${`${baseUrl}/health`.padEnd(35)}  │
└─────────────────────────────────────────────────────┘`

  logger.log(startupMessage)

  // Signal PM2 (or any process manager) that the app is ready to receive traffic.
  // Required for `wait_ready: true` in ecosystem.config.cjs so rolling reloads
  // only cut over after the new worker is fully initialised.
  if (process.send) {
    process.send('ready')
  }

  // Graceful shutdown — drain in-flight requests before exiting.
  // PM2 sends SIGINT on `pm2 reload`; the kill_timeout gives us 10 s to finish.
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal} — shutting down gracefully`)
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

await bootstrap()
