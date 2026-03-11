import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import type { ExecutionContext } from '@nestjs/common'

/**
 * Optional JWT auth guard.
 *
 * If a valid JWT is provided, `req.user` is populated.
 * If the JWT is missing/invalid, the request continues unauthenticated.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      // AuthGuard expects TUser; returning `undefined` is fine at runtime, but needs a cast for TS.
      return undefined as unknown as TUser
    }
    return user
  }
}
