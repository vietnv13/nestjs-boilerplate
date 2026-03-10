# Domain-Driven Design Patterns

## Core Building Blocks

### Entities

Entities have **identity** — two entities with the same data but different IDs are distinct.
In this codebase, entities are typed as plain TypeScript interfaces backed by the Drizzle ORM
schema types from `@workspace/database`.

```typescript
// modules/user/domain/user.entity.ts
export interface User {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Aggregate Roots

Aggregates enforce **business invariants** and collect **domain events** to be published
after a successful state change. They extend `BaseAggregateRoot`.

```typescript
// shared-kernel/domain/base-aggregate-root.ts
export abstract class BaseAggregateRoot {
  protected addDomainEvent(event: BaseDomainEvent): void { … }
  getDomainEvents(): BaseDomainEvent[]                   { … }
  clearDomainEvents(): void                              { … }
}
```

The only aggregate root currently implemented is **`AuthIdentity`** (auth module), which
wraps the accounts table and exposes domain methods like `setPassword()`, `updateOAuthTokens()`.

```typescript
// After mutating an aggregate, publish its queued events:
await this.domainEventPublisher.publishEventsForAggregate(authIdentity)
```

### Domain Events

Events describe **facts** that occurred. All domain events extend `BaseDomainEvent`:

```typescript
// shared-kernel/domain/base-domain-event.ts
export abstract class BaseDomainEvent {
  readonly aggregateId: string
  readonly occurredAt: Date
  abstract readonly eventType: string // e.g. "todo.created"
}
```

**Naming convention**: past tense, noun-first (`TodoCreatedEvent`, `UserDeletedEvent`).

**Example**:

```typescript
// modules/todo/domain/events/todo.events.ts
export class TodoCreatedEvent extends BaseDomainEvent {
  readonly eventType = 'todo.created'
  constructor(
    public readonly todoId: string,
    public readonly title: string,
  ) {
    super(todoId)
  }
}
```

### Value Objects

Immutable domain primitives with no identity. Currently implemented:

| Value Object         | Location                                             | Usage                         |
| -------------------- | ---------------------------------------------------- | ----------------------------- |
| `RoleType` / `ROLES` | `shared-kernel/domain/value-objects/role.vo.ts`      | Auth — user role type         |
| `AuthProvider`       | `modules/auth/domain/value-objects/auth-provider.ts` | Auth — identity provider enum |

---

## Repository Pattern (Ports & Adapters)

Repositories are defined as **interfaces** (ports) in the application layer and implemented
in the infrastructure layer. This is the **Dependency Inversion Principle** in practice.

```typescript
// Port — application/ports/todo.repository.port.ts
export interface TodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  create(data: Omit<InsertTodo, "id" | "createdAt" | "updatedAt">): Promise<Todo>;
  update(id: string, data: Partial<…>): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
}
export const TODO_REPOSITORY = Symbol("TODO_REPOSITORY");

// Adapter — infrastructure/repositories/todo.repository.ts
@Injectable()
export class TodoRepositoryImpl implements TodoRepository { … }

// Wired in module:
{ provide: TODO_REPOSITORY, useClass: TodoRepositoryImpl }
```

**Rules:**

- One repository per aggregate root / entity cluster.
- Repositories return domain types, never raw ORM records.
- Infrastructure details (Drizzle, Redis) stay inside the implementation.

---

## CQRS Pattern

Used by `todo` and `user` modules. **Commands** mutate state; **Queries** read state.
Controllers never contain business logic — they only construct and dispatch.

```typescript
// Controller
@Post()
async create(@Body() dto: CreateTodoDto): Promise<Todo> {
  return this.commandBus.execute(
    new CreateTodoCommand(dto.title, dto.description)
  );
}

// Command (plain data carrier)
export class CreateTodoCommand {
  constructor(
    public readonly title: string,
    public readonly description?: string,
  ) {}
}

// Handler (business logic)
@CommandHandler(CreateTodoCommand)
export class CreateTodoHandler implements ICommandHandler<CreateTodoCommand, Todo> {
  async execute(command: CreateTodoCommand): Promise<Todo> {
    const todo = await this.todoRepository.create({ title: command.title, … });
    this.eventBus.publish(new TodoCreatedEvent(todo.id, todo.title));
    return todo;
  }
}
```

---

## Application Service Pattern

The **`auth`** module uses `AuthService` instead of CQRS handlers. This is appropriate
when a use case coordinates multiple aggregates/repos in a single transactional unit,
making a flat service more readable than a chain of commands.

```typescript
@Injectable()
export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const identity = await this.authIdentityRepo.findByProviderAndIdentifier("email", email);
    if (!identity) throw new UnauthorizedException(…);
    const ok = await this.passwordHasher.verify(password, identity.password);
    if (!ok) throw new UnauthorizedException(…);
    // issue tokens, create session …
    return { user, accessToken, refreshToken };
  }
}
```

---

## Domain Exception Hierarchy

All domain errors extend `DomainException` which carries a typed `code` and maps to an
HTTP status. Exception filters transform them to RFC 9457 Problem Details automatically.

```
DomainException (base)
├── NotFoundException       → 404  (NotFoundException, UserNotFoundException)
├── ValidationException     → 400
├── ConflictException       → 409
└── BusinessRuleException   → 422  (UserAlreadyExistsException, UserBannedException)
```

**Throw from domain/application layer:**

```typescript
throw new UserNotFoundException(userId)
throw new UserAlreadyExistsException(email)
throw new ValidationException('Title cannot be empty')
```

---

## Bounded Contexts

Each module is a bounded context with an **anti-corruption layer** at its boundary:

```
┌──────────────────┐    domain events     ┌──────────────────┐
│   auth context   │ ──────────────────► │  user context   │
│                  │                      │                  │
│  AuthIdentity    │    shared kernel     │  User entity     │
│  AuthSession     │ ◄──────────────────  │  UserRepository  │
└──────────────────┘  UserRepository port └──────────────────┘
```

The `auth` module accesses user data through the **shared-kernel `UserRepository` port**,
not the user module's port. This prevents a circular dependency and keeps auth's user
concept minimal (id, name, email, role, banned).

---

## Saga Pattern

Sagas react to domain events and orchestrate multi-step workflows. They live in
`shared-kernel/infrastructure/events/sagas/` because they coordinate cross-module actions.

```typescript
@Injectable()
export class UserRegistrationSaga extends BaseSaga {
  @Saga()
  saga(events$: Observable<IEvent>): Observable<any> {
    return this.filterEvents(events$, UserCreatedEvent).pipe(
      delay(100),
      map((event) => {
        // Dispatch follow-up commands here, e.g.:
        // this.commandBus.execute(new SendWelcomeEmailCommand(event.userId));
        return null
      }),
    )
  }
}
```

---

## Anti-Patterns to Avoid

| Anti-pattern                     | Why it's bad                            | Better approach                                      |
| -------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| Business logic in controllers    | Controllers become fat, untestable      | Move to command handler or service                   |
| Infrastructure imports in domain | Domain tied to framework                | Define ports; implement in infrastructure            |
| Direct cross-module imports      | Tight coupling, hinders refactoring     | Communicate via domain events or shared-kernel ports |
| Generic `Repository<T>`          | Loses domain semantics                  | Explicit interface per aggregate                     |
| `console.log` in infrastructure  | Unstructured, can't be filtered/sampled | Inject NestJS `Logger`                               |
