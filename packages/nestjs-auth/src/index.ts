// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard.js'
export { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard.js'

// Strategy + payload type
export type { JwtPayload } from './strategies/jwt.strategy.js'
export { JwtStrategy } from './strategies/jwt.strategy.js'

// Services
export { BcryptPasswordHasher } from './services/bcrypt-password-hasher.js'

// Repositories
export { AuthIdentityRepository } from './repositories/auth-identity.repository.js'
export { AuthSessionRepository } from './repositories/auth-session.repository.js'
export type { Role } from './repositories/user-role.repository.js'
export { UserRoleRepository } from './repositories/user-role.repository.js'
export { VerificationTokenRepository } from './repositories/verification-token.repository.js'
