import { Module } from '@nestjs/common'
import { SseModule } from '@workspace/nestjs-sse'

import { AdminAuthController } from '@/admin/controllers/admin-auth.controller'
import { AdminNotificationsController } from '@/admin/controllers/admin-notifications.controller'
import { AdminSseController } from '@/admin/controllers/admin-sse.controller'
import { AuthModule } from '@/auth/auth.module'

/**
 * Admin Module
 *
 * Provides admin-only functionality.
 * All auth endpoints under /admin/auth enforce the ADMIN role.
 */
@Module({
  imports: [AuthModule, SseModule],
  controllers: [AdminAuthController, AdminNotificationsController, AdminSseController],
})
export class AdminModule {}
