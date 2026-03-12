import * as schema from '@workspace/database'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import type { DrizzleModuleOptions } from './drizzle.types.js'

/**
 * Factory: creates a Drizzle ORM instance backed by a `node-postgres` connection pool.
 *
 * Separated from the NestJS module so it can be tested or reused outside of NestJS DI.
 */
export function createDrizzleInstance(options: DrizzleModuleOptions) {
  const pool = new Pool({
    connectionString: options.connectionString,
    max: options.pool?.max ?? 10,
    min: options.pool?.min ?? 2,
    idleTimeoutMillis: options.pool?.idleTimeoutMillis ?? 30_000,
    connectionTimeoutMillis: options.pool?.connectionTimeoutMillis ?? 5000,
  })

  return drizzle({ client: pool, schema })
}
