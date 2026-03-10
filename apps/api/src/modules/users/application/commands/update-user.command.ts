export class UpdateUserCommand {
  constructor(
    public readonly id: string,
    public readonly data: {
      name?: string;
      email?: string;
      image?: string;
    },
  ) {}
}
