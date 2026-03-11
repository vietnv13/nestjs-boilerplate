import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

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
      throw new ForbiddenException('Admin access required')
    }
    return user
  }
}
