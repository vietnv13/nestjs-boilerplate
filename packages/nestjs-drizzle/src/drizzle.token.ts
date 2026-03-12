import type * as schema from '@workspace/database'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

/**
 * DI injection token for the Drizzle database instance.
 *
 * Use this token to inject the database anywhere in your application:
 *
 * @example
 * ```ts
 * @Injectable()
 * export class UserRepository {
 *   constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}
 * }
 * ```
 */
export const DB_TOKEN = Symbol('DB_TOKEN')

/**
 * Fully-typed Drizzle ORM instance (PostgreSQL + full schema).
 * All tables and relations from `@workspace/database` are available.
 */
export type DrizzleDb = NodePgDatabase<typeof schema>

/**
 * Re-export of the entire database schema type.
 * Useful when you need schema-level type inference.
 */
export type Schema = typeof schema
