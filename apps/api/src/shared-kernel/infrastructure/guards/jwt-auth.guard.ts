import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * JWT Authentication Guard (shared-kernel)
 *
 * Modules cannot import each other (boundaries), so cross-cutting guards live in shared-kernel.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
