import { randomUUID } from 'node:crypto'

import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { SseHubService } from '@workspace/nestjs-sse'

import {
  AdminNotificationCreateDto,
  AdminNotificationPublishResponseDto,
} from '@/modules/admin/dtos/admin-notification.dto'
import { AdminGuard } from '@/modules/admin/guards/admin.guard'

type AdminRequest = Express.Request & { user: { id: string; email: string; roles: string[] } }

const ADMIN_BROADCAST_CHANNEL = 'admin.event.broadcast'
const userChannel = (userId: string) => `admin.event.user.${userId}`

@ApiTags('admin-notifications')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly sseHub: SseHubService) {}

  @Post('test')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a test notification to the current admin user' })
  @ApiResponse({ status: 200, type: AdminNotificationPublishResponseDto })
  async publishTest(
    @Request() req: AdminRequest,
    @Body() dto: AdminNotificationCreateDto,
  ): Promise<AdminNotificationPublishResponseDto> {
    const result = await this.sseHub.publish(userChannel(req.user.id), {
      type: 'notification',
      data: {
        id: randomUUID(),
        title: dto.title,
        description: dto.description,
        createdAt: new Date().toISOString(),
      },
    })
    return result
  }

  @Post('broadcast-test')
  @UseGuards(AdminGuard)
  @SkipThrottle()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a test notification to all connected admins' })
  @ApiResponse({ status: 200, type: AdminNotificationPublishResponseDto })
  async publishBroadcastTest(
    @Body() dto: AdminNotificationCreateDto,
  ): Promise<AdminNotificationPublishResponseDto> {
    const result = await this.sseHub.publish(ADMIN_BROADCAST_CHANNEL, {
      type: 'notification',
      data: {
        id: randomUUID(),
        title: dto.title,
        description: dto.description,
        createdAt: new Date().toISOString(),
      },
    })
    return result
  }
}
