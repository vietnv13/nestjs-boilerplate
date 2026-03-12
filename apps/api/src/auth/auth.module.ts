import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import {
  AuthIdentityRepository,
  AuthSessionRepository,
  BcryptPasswordHasher,
  JwtStrategy,
  UserRoleRepository,
  VerificationTokenRepository,
} from '@workspace/nestjs-auth'

import { AuthService } from '@/auth/auth.service'
import { AuthController } from '@/auth/controllers/auth.controller'
import { CleanupExpiredTokensJob } from '@/auth/jobs/cleanup-expired-tokens.job'
import { UserModule } from '@/user/user.module'

import type { Env } from '@/config/env.schema'

/**
 * Auth Module
 *
 * Provides authentication functionality using 3+2+1 architecture:
 * - auth_identities: Multiple authentication methods (email/OAuth/phone)
 * - auth_sessions: Session management (Refresh Token)
 * - user_roles: Multi-role support
 * - auth_verification_tokens: Temporary verification tokens
 */
@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<Env, true>) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuthIdentityRepository,
    AuthSessionRepository,
    UserRoleRepository,
    VerificationTokenRepository,
    BcryptPasswordHasher,
    CleanupExpiredTokensJob,
  ],
  exports: [AuthService],
})
export class AuthModule {}
