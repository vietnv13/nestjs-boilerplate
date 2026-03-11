import { Injectable, Inject } from '@nestjs/common'
import { sql } from 'drizzle-orm'

import { DB_TOKEN } from '@workspace/nestjs-drizzle'

import type { DrizzleDb } from '@workspace/nestjs-drizzle'
import type { HealthIndicatorResult } from '@nestjs/terminus'

/**
 * Drizzle database health indicator - verifies connection via SELECT 1
 */
@Injectable()
export class DrizzleHealthIndicator {
  constructor(@Inject(DB_TOKEN) private readonly database: DrizzleDb) {}

  /**
   * Check database connection health
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.database.execute(sql`SELECT 1`)

      return {
        [key]: {
          status: 'up' as const,
          message: 'Database is available',
        },
      }
    } catch (error) {
      return {
        [key]: {
          status: 'down' as const,
          message: error instanceof Error ? error.message : 'Database check failed',
        },
      }
    }
  }
}
