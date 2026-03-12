import type { InjectionToken, ModuleMetadata } from '@nestjs/common'

/**
 * Redis connection options passed directly to `RedisModule.forRoot()`.
 */
export interface RedisModuleOptions {
  /** Full Redis URL, e.g. `redis://localhost:6379` or `redis://:password@host:6379` */
  url: string
}

/**
 * Async factory options for `RedisModule.forRootAsync()`.
 *
 * @example
 * ```ts
 * RedisModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     url: buildRedisUrl(config),
 *   }),
 * })
 * ```
 */
export interface RedisAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: InjectionToken[]
  useFactory: (...args: unknown[]) => RedisModuleOptions | Promise<RedisModuleOptions>
}
