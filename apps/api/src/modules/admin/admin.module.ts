import { Module } from '@nestjs/common'
import { SseModule } from '@workspace/nestjs-sse'

import { AdminAuthController } from '@/modules/admin/controllers/admin-auth.controller'
import { AdminNotificationsController } from '@/modules/admin/controllers/admin-notifications.controller'
import { AdminSseController } from '@/modules/admin/controllers/admin-sse.controller'
import { AuthModule } from '@/modules/auth/auth.module'

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
