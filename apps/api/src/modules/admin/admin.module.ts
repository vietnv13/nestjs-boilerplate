import { Module } from '@nestjs/common'

import { AdminAuthController } from '@/modules/admin/presentation/controllers/admin-auth.controller'
import { AuthModule } from '@/modules/auth/auth.module'

/**
 * Admin Module
 *
 * Provides admin-only functionality.
 * All auth endpoints under /admin/auth enforce the ADMIN role.
 */
@Module({
  imports: [AuthModule],
  controllers: [AdminAuthController],
})
export class AdminModule {}
