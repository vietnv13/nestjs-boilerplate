import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'

import { DrizzleHealthIndicator } from './drizzle.health.js'
import { HealthController } from './health.controller.js'

/**
 * Health check module - database, memory, and disk checks
 * Database connection provided by global DrizzleModule
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DrizzleHealthIndicator],
})
export class HealthModule {}
