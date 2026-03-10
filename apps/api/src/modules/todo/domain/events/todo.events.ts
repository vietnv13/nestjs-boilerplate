import { BaseDomainEvent } from "@/shared-kernel/domain/base-domain-event";

export class TodoCreatedEvent extends BaseDomainEvent {
  readonly eventType = "todo.created";

  constructor(
    public readonly todoId: string,
    public readonly title: string,
  ) {
    super(todoId);
  }
}

export class TodoUpdatedEvent extends BaseDomainEvent {
  readonly eventType = "todo.updated";

  constructor(
    public readonly todoId: string,
    public readonly changes: {
      title?: string;
      description?: string;
      isCompleted?: boolean;
    },
  ) {
    super(todoId);
  }
}

export class TodoCompletedEvent extends BaseDomainEvent {
  readonly eventType = "todo.completed";

  constructor(public readonly todoId: string) {
    super(todoId);
  }
}

export class TodoDeletedEvent extends BaseDomainEvent {
  readonly eventType = "todo.deleted";

  constructor(public readonly todoId: string) {
    super(todoId);
  }
}
