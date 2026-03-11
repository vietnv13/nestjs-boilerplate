import { Module } from '@nestjs/common'

import { AdminAuthController } from '@/modules/admin/presentation/controllers/admin-auth.controller'
import { AdminNotificationsController } from '@/modules/admin/presentation/controllers/admin-notifications.controller'
import { AdminSseController } from '@/modules/admin/presentation/controllers/admin-sse.controller'
import { AuthModule } from '@/modules/auth/auth.module'
import { SseModule } from '@workspace/nestjs-sse'

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
