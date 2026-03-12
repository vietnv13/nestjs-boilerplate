import type { InjectionToken, ModuleMetadata } from '@nestjs/common'

/**
 * PostgreSQL connection pool tuning options.
 * All values are optional — defaults are applied in `DrizzleFactory`.
 */
export interface DrizzlePoolOptions {
  /** Maximum number of pool connections. Default: 10 */
  max?: number
  /** Minimum number of pool connections kept alive. Default: 2 */
  min?: number
  /** Milliseconds before an idle connection is released. Default: 30 000 */
  idleTimeoutMillis?: number
  /** Milliseconds to wait for a new connection before throwing. Default: 5 000 */
  connectionTimeoutMillis?: number
}

/**
 * Options passed to `DrizzleModule.forRoot()` or used inside a `forRootAsync` factory.
 */
export interface DrizzleModuleOptions {
  /** Full PostgreSQL connection string, e.g. `postgres://user:pass@host:5432/db` */
  connectionString: string
  /** Optional pool overrides. */
  pool?: DrizzlePoolOptions
}

/**
 * Async factory options for `DrizzleModule.forRootAsync()`.
 * Mirrors the `@nestjs/typeorm` async pattern.
 *
 * @example
 * ```ts
 * DrizzleModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     connectionString: config.getOrThrow('DATABASE_URL'),
 *     pool: { max: 20 },
 *   }),
 * })
 * ```
 */
export interface DrizzleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[]
  useFactory: (...args: unknown[]) => DrizzleModuleOptions | Promise<DrizzleModuleOptions>
}
