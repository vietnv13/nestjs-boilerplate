import { Body, Controller, ForbiddenException, Get, Post, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { AdminGuard } from '@/modules/admin/presentation/guards/admin.guard'
import { AuthService } from '@/modules/auth/application/services/auth.service'
import { LoginDto, LoginResponseDto } from '@/modules/auth/presentation/dtos/login.dto'
import { LogoutDto, LogoutResponseDto } from '@/modules/auth/presentation/dtos/logout.dto'
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '@/modules/auth/presentation/dtos/refresh-token.dto'
import { SessionResponseDto } from '@/modules/auth/presentation/dtos/session-response.dto'

/**
 * Admin Auth Controller
 *
 * Authentication endpoints restricted to ADMIN users only.
 * Login rejects users who do not have the ADMIN role.
 */
@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Admin login — rejects non-ADMIN users
   */
  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async login(
    @Body() dto: LoginDto,
    @Request()
    req: Express.Request & { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<LoginResponseDto> {
    const userAgent = req.headers['user-agent']
    const result = await this.authService.login(dto.email, dto.password, {
      ipAddress: req.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    })

    if (result.user.role?.toUpperCase() !== 'ADMIN') {
      await this.authService.logout(result.refreshToken)
      throw new ForbiddenException('Admin access required')
    }

    return result
  }

  /**
   * Refresh access token
   */
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh admin access token' })
  @ApiResponse({ status: 200, type: RefreshTokenResponseDto })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    return await this.authService.refreshToken(dto.refreshToken)
  }

  /**
   * Get current admin session info
   */
  @Get('session')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin session info' })
  @ApiResponse({ status: 200, type: SessionResponseDto })
  async getSession(
    @Request()
    req: Express.Request & {
      user: { id: string; email: string; roles: string[]; sessionId: string }
    },
  ): Promise<SessionResponseDto> {
    const role = req.user.roles[0] ?? null
    return this.authService.getSession(req.user.sessionId, req.user.id, req.user.email, role)
  }

  /**
   * Admin logout
   */
  @Post('logout')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin logout' })
  @ApiResponse({ status: 200, type: LogoutResponseDto })
  async logout(@Body() dto: LogoutDto): Promise<LogoutResponseDto> {
    const success = await this.authService.logout(dto.refreshToken)
    return {
      success,
      message: success ? 'Logout successful' : 'Logout failed, session not found or expired',
    }
  }
}
