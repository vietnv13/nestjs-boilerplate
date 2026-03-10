export class RegisterCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly deviceContext?: {
      ipAddress?: string;
      userAgent?: string;
    },
  ) {}
}
