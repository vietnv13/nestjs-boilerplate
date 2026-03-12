# Project Memory

## Project

NestJS monorepo boilerplate at `/Users/vietnv/Projects/nestjs-boilerplate`

- Package manager: pnpm with Turborepo
- Main app: `apps/api` (NestJS 11, Node ≥ 22.18.0)
- Other apps: `apps/admin`, `apps/web` (Next.js 16)
- Shared packages: `packages/`

## Key Architecture

- Feature modules: `apps/api/src/modules/{admin,asset,auth,todo,user}`
- App-specific infra: `apps/api/src/app/{config,health,swagger}`
- All reusable HTTP infra lives in `packages/nestjs-http`

## packages/nestjs-http

Created to extract reusable HTTP infrastructure from the API app.
Exports: 7 interceptors (correlation-id, deprecation, link-header, location-header, request-context, timeout, trace-context), 2 middleware (api-version, etag), and `createValidationPipe` factory.

## Other Key Packages

- `@workspace/nestjs-drizzle` — Drizzle DB module + `DB_TOKEN`
- `@workspace/nestjs-cache` — cache-manager
- `@workspace/nestjs-queue` — BullMQ job queue
- `@workspace/nestjs-scheduler` — distributed cron with Redis locks
- `@workspace/nestjs-storage` — local/S3 storage
- `@workspace/nestjs-sse` — Server-Sent Events hub
- `@workspace/nestjs-problem-details` — RFC 9457 filter + DTO
- `@workspace/nestjs-request-context` — CLS config + W3C trace utils
- `@workspace/nestjs-logger` — Pino logging

## Package Config Pattern

Each package uses: `tsconfig.json` (extends nestjs.json), `tsconfig.build.json` (NodeNext, emitDecoratorMetadata), `eslint.config.mts` (composeConfig from @workspace/eslint-config).
