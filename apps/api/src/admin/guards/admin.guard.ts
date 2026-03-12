import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { createHttpException, ErrorCode } from '@workspace/error-code'

/**
 * Admin Guard
 *
 * Validates JWT and enforces ADMIN role.
 * Use on routes that are only accessible to admins.
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest<T = any>(err: Error | null, user: T & { roles?: string[] }): T {
    if (err || !user) {
      throw err ?? new UnauthorizedException()
    }
    const isAdmin = user.roles?.some((r) => r.toUpperCase() === 'ADMIN')
    if (!isAdmin) {
      throw createHttpException(ErrorCode.ADMIN_ACCESS_REQUIRED)
    }
    return user
  }
}
