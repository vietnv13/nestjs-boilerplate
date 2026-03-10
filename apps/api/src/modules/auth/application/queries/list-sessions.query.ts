export class ListSessionsQuery {
  constructor(
    public readonly userId: string,
    public readonly currentSessionId: string,
  ) {}
}
