import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { createHttpException, ErrorCode } from '@workspace/error-code'
import {
  AuthIdentityRepository,
  AuthSessionRepository,
  BcryptPasswordHasher,
  UserRoleRepository,
} from '@workspace/nestjs-auth'

import { UserRepository } from '@/user/repositories/user.repository'

import type { Env } from '@/config/env.schema'
import type { AccountDatabase, SessionDatabase } from '@workspace/database'
import type { JwtPayload, Role } from '@workspace/nestjs-auth'

/**
 * Device information interface
 */
interface DeviceContext {
  ipAddress?: string
  userAgent?: string
}

/**
 * Auth Service
 *
 * Handles authentication business logic
 * Compatible with better-auth schema:
 * - accounts: Multiple authentication methods
 * - sessions: Session management
 * - users.role: Single role
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly authIdentityRepo: AuthIdentityRepository,
    private readonly authSessionRepo: AuthSessionRepository,
    private readonly passwordHasher: BcryptPasswordHasher,
    private readonly userRoleRepo: UserRoleRepository,
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  /**
   * User login (email/password)
   */
  async login(email: string, password: string, deviceContext?: DeviceContext) {
    // 1. Find authentication identity by email
    const identity = await this.authIdentityRepo.findByProviderAndIdentifier('email', email)
    if (!identity) {
      throw createHttpException(ErrorCode.AUTH_INVALID_EMAIL_OR_PASSWORD)
    }

    // 2. Verify password
    if (!identity.password) {
      throw createHttpException(ErrorCode.AUTH_INVALID_EMAIL_OR_PASSWORD)
    }
    const isValid = await this.passwordHasher.verify(password, identity.password)
    if (!isValid) {
      throw createHttpException(ErrorCode.AUTH_INVALID_EMAIL_OR_PASSWORD)
    }

    // 3. Save authentication identity (update updatedAt)
    await this.authIdentityRepo.save(identity)

    // 4. Get user role
    const role = await this.userRoleRepo.getRole(identity.userId)

    // 5. Generate tokens
    return this.generateTokens(identity.userId, email, role, deviceContext)
  }

  /**
   * User registration (email/password)
   */
  async register(
    email: string,
    password: string,
    name: string,
    deviceContext?: DeviceContext,
    initialRole: Role = 'user',
  ) {
    // 1. Check if email already exists
    const exists = await this.authIdentityRepo.existsByIdentifier(email)
    if (exists) {
      throw createHttpException(ErrorCode.AUTH_EMAIL_ALREADY_REGISTERED)
    }

    // 2. Create user
    const user = await this.userRepo.create({
      email,
      name,
      role: initialRole,
    })

    // 3. Create authentication identity
    const identityId = randomUUID()
    const passwordHash = await this.passwordHasher.hash(password)
    const now = new Date()
    const identity: AccountDatabase = {
      id: identityId,
      userId: user.id,
      providerId: 'email',
      accountId: email.toLowerCase(),
      password: passwordHash,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      createdAt: now,
      updatedAt: now,
    }

    await this.authIdentityRepo.save(identity)

    // 4. Generate tokens
    return this.generateTokens(user.id, email, initialRole, deviceContext)
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string, deviceContext?: DeviceContext) {
    // 1. Find session
    const session = await this.authSessionRepo.findByToken(refreshToken)
    if (!session || session.expiresAt <= new Date()) {
      throw createHttpException(ErrorCode.AUTH_INVALID_REFRESH_TOKEN)
    }

    // 2. Delete old session
    await this.authSessionRepo.delete(session.id)

    // 3. Get user authentication info
    const identities = await this.authIdentityRepo.findByUserId(session.userId)
    const emailIdentity = identities.find((i) => i.providerId === 'email')
    const email = emailIdentity?.accountId ?? ''

    // 4. Get user role
    const role = await this.userRoleRepo.getRole(session.userId)

    // 5. Generate new tokens
    return this.generateTokens(session.userId, email, role, deviceContext)
  }

  /**
   * Logout (delete current session)
   */
  async logout(refreshToken: string): Promise<boolean> {
    const session = await this.authSessionRepo.findByToken(refreshToken)
    if (!session) {
      return false
    }
    return this.authSessionRepo.delete(session.id)
  }

  /**
   * Revoke all sessions (logout all devices)
   */
  async revokeAllSessions(userId: string): Promise<number> {
    return this.authSessionRepo.deleteAllByUserId(userId)
  }

  /**
   * Revoke specific session
   */
  async revokeSession(
    sessionId: string,
    userId: string,
    currentSessionId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Cannot revoke current session
    if (sessionId === currentSessionId) {
      return {
        success: false,
        message: 'Cannot revoke current session, use logout instead',
      }
    }

    // Find session
    const session = await this.authSessionRepo.findById(sessionId)
    if (session?.userId !== userId) {
      return {
        success: false,
        message: 'Session not found or unauthorized',
      }
    }

    // Delete session
    const deleted = await this.authSessionRepo.delete(sessionId)
    return {
      success: deleted,
      message: deleted ? 'Session revoked' : 'Revoke failed',
    }
  }

  /**
   * @deprecated Use revokeAllSessions instead
   */
  async logoutAll(userId: string): Promise<number> {
    return this.revokeAllSessions(userId)
  }

  /**
   * Get current session info
   */
  async getSession(sessionId: string, userId: string, email: string, role: string | null) {
    const session = await this.authSessionRepo.findById(sessionId)
    if (session?.userId !== userId) {
      throw createHttpException(ErrorCode.AUTH_SESSION_NOT_FOUND_OR_EXPIRED)
    }

    return {
      user: {
        id: userId,
        email,
        role,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    }
  }

  /**
   * List active sessions for user
   */
  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.authSessionRepo.findActiveByUserId(userId)
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === currentSessionId,
      })),
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // 1. Find email authentication identity
    const identity = await this.authIdentityRepo.findByUserIdAndProvider(userId, 'email')
    if (!identity) {
      throw createHttpException(ErrorCode.AUTH_EMAIL_AUTHENTICATION_NOT_FOUND)
    }

    // 2. Verify current password
    if (!identity.password) {
      throw createHttpException(ErrorCode.AUTH_INVALID_CURRENT_PASSWORD)
    }
    const isValid = await this.passwordHasher.verify(currentPassword, identity.password)
    if (!isValid) {
      throw createHttpException(ErrorCode.AUTH_INVALID_CURRENT_PASSWORD)
    }

    // 3. Change password
    const newPasswordHash = await this.passwordHasher.hash(newPassword)
    identity.password = newPasswordHash
    await this.authIdentityRepo.save(identity)

    // 4. Delete all sessions (enhanced security)
    await this.authSessionRepo.deleteAllByUserId(userId)
  }

  /**
   * Generate Access Token and Refresh Token
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: Role | null,
    deviceContext?: DeviceContext,
  ) {
    // Generate Refresh Token
    const refreshToken = randomUUID()

    // Calculate expiration time (default 7 days)
    const refreshExpiresIn =
      this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true }) ?? '7d'
    const expiresAt = this.parseExpiration(refreshExpiresIn)

    // Create session (create first to get sessionId)
    const sessionId = randomUUID()
    const now = new Date()
    const session: SessionDatabase = {
      id: sessionId,
      userId,
      token: refreshToken,
      expiresAt,
      impersonatedBy: null,
      ipAddress: deviceContext?.ipAddress ?? null,
      userAgent: deviceContext?.userAgent ?? null,
      createdAt: now,
      updatedAt: now,
    }
    await this.authSessionRepo.save(session)

    // Generate Access Token (includes sessionId)
    const payload: JwtPayload = {
      sub: userId,
      email,
      roles: role ? [role] : [], // Maintain compatibility, wrap single role in array
      sessionId,
    }
    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        role,
      },
    }
  }

  /**
   * Parse expiration time string
   */
  private parseExpiration(expiresIn: string): Date {
    const now = new Date()
    const match = /^(\d+)([smhd])$/.exec(expiresIn)

    if (!match) {
      // Default 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    const value = Number.parseInt(match[1]!, 10)
    const unit = match[2]!

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }

    return new Date(now.getTime() + value * multipliers[unit]!)
  }
}
