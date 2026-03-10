import { Inject, UnauthorizedException } from "@nestjs/common";
import { CommandHandler } from "@nestjs/cqrs";
import type { ICommandHandler } from "@nestjs/cqrs";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { LoginCommand } from "./login.command";
import { AUTH_IDENTITY_REPOSITORY } from "../ports/auth-identity.repository.port";
import { AUTH_SESSION_REPOSITORY } from "../ports/auth-session.repository.port";
import { PASSWORD_HASHER } from "../ports/password-hasher.port";
import { USER_REPOSITORY } from "@/shared-kernel/application/ports/user.repository.port";
import type { AuthIdentityRepository } from "../ports/auth-identity.repository.port";
import type { AuthSessionRepository } from "../ports/auth-session.repository.port";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { UserRepository } from "@/shared-kernel/application/ports/user.repository.port";
import { AuthProvider } from "@/modules/auth/domain/value-objects/auth-provider";
import { AuthSession } from "@/modules/auth/domain/entities/auth-session.entity";
import type { Env } from "@/app/config/env.schema";

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(AUTH_IDENTITY_REPOSITORY)
    private readonly authIdentityRepo: AuthIdentityRepository,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepo: AuthSessionRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
  ) {}

  async execute(command: LoginCommand) {
    // Find auth identity by email
    const identity = await this.authIdentityRepo.findByProviderAndIdentifier(
      AuthProvider.EMAIL,
      command.email,
    );
    if (!identity || !identity.credentialHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isValid = await this.passwordHasher.verify(identity.credentialHash, command.password);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Get user by ID
    const user = await this.userRepo.findById(identity.userId);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.configService.get("JWT_EXPIRES_IN") },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: "refresh" },
      { expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN") },
    );

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session = AuthSession.create(
      crypto.randomUUID(),
      user.id,
      refreshToken,
      expiresAt,
      command.deviceContext?.ipAddress,
      command.deviceContext?.userAgent,
    );
    await this.authSessionRepo.save(session);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}
