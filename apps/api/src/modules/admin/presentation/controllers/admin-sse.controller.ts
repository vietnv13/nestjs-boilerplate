import { Controller, Request, Sse, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { interval, merge, of } from 'rxjs'
import { map } from 'rxjs/operators'

import { AdminGuard } from '@/modules/admin/presentation/guards/admin.guard'
import { SseHubService } from '@/shared-kernel/infrastructure/sse/sse-hub.service'

import type { MessageEvent } from '@nestjs/common'

type AdminRequest = Express.Request & { user: { id: string; email: string; roles: string[] } }

const ADMIN_BROADCAST_CHANNEL = 'admin.event.broadcast'
const userChannel = (userId: string) => `admin.event.user.${userId}`

@ApiTags('admin-sse')
@Controller('admin/sse')
export class AdminSseController {
  constructor(private readonly sseHub: SseHubService) {}

  /**
   * Single SSE entrypoint for the admin app.
   *
   * Heartbeat is emitted to avoid the global 30s TimeoutInterceptor killing the connection.
   */
  @Sse('stream')
  @SkipThrottle()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin SSE stream (notifications, etc.)' })
  stream(@Request() req: AdminRequest) {
    const heartbeat$ = interval(15_000).pipe(map((): MessageEvent => ({ type: 'ping', data: {} })))
    const ready$ = of({ type: 'ready', data: { userId: req.user.id } } satisfies MessageEvent)

    return merge(
      ready$,
      this.sseHub.subscribe(ADMIN_BROADCAST_CHANNEL),
      this.sseHub.subscribe(userChannel(req.user.id)),
      heartbeat$,
    )
  }
}
