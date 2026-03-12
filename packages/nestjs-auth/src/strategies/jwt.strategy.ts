import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

/**
 * JWT payload - standard claims for this boilerplate's auth pattern
 */
export interface JwtPayload {
  sub: string // User ID
  email: string
  roles: string[]
  sessionId: string // Session ID
}

/**
 * JWT Strategy
 *
 * Validates JWT token and extracts user information.
 * Reads JWT_SECRET from ConfigService.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    })
  }

  /**
   * Validate JWT payload.
   * Passport verifies signature and expiration before calling this.
   */
  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId,
    }
  }
}
