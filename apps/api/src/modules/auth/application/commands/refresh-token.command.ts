export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly deviceContext?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {}
}
