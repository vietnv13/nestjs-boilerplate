import { PostgreSqlContainer } from '@testcontainers/postgresql'
import * as schema from '@workspace/database/schemas'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

export class TestDatabase {
  private container: StartedPostgreSqlContainer | null = null
  private pool: Pool | null = null
  public db: NodePgDatabase<typeof schema> | null = null
  public connectionString: string = ''

  async setup(): Promise<void> {
    // Start PostgreSQL container
    this.container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start()

    this.connectionString = this.container.getConnectionUri()

    // Create connection pool
    this.pool = new Pool({
      connectionString: this.connectionString,
    })

    // Initialize Drizzle
    this.db = drizzle(this.pool, { schema })

    // Run migrations
    await migrate(this.db, {
      migrationsFolder: '../../../packages/database/drizzle',
    })
  }

  async teardown(): Promise<void> {
    await this.pool?.end()
    await this.container?.stop()
  }

  async cleanup(): Promise<void> {
    if (!this.db) return

    // Clear all tables
    const tables = Object.values(schema)
    for (const table of tables) {
      if (typeof table === 'object' && 'delete' in table) {
        await this.db.delete(table as any)
      }
    }
  }
}

// Global test database instance
export const testDb = new TestDatabase()
