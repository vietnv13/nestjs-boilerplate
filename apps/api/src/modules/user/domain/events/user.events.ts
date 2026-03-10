import { BaseDomainEvent } from '@/shared-kernel/domain/base-domain-event'

export class UserCreatedEvent extends BaseDomainEvent {
  readonly eventType = 'user.created'

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string | null,
  ) {
    super(userId)
  }
}

export class UserUpdatedEvent extends BaseDomainEvent {
  readonly eventType = 'user.updated'

  constructor(
    public readonly userId: string,
    public readonly changes: Record<string, unknown>,
  ) {
    super(userId)
  }
}

export class UserDeletedEvent extends BaseDomainEvent {
  readonly eventType = 'user.deleted'

  constructor(public readonly userId: string) {
    super(userId)
  }
}
