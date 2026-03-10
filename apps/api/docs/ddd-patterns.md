# Domain-Driven Design Patterns

## Overview

This guide explains how DDD patterns are implemented in this codebase.

## Core Concepts

### Entities

Entities have identity and lifecycle. Two entities with the same data but different IDs are different.

```typescript
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Characteristics**:

- Has unique identifier
- Mutable (can change over time)
- Identity-based equality

### Value Objects

Value objects have no identity. Two value objects with the same data are the same.

```typescript
export class Email extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.value.includes("@")) {
      throw new ValidationException("Invalid email format");
    }
  }
}
```

**Key Characteristics**:

- No unique identifier
- Immutable
- Value-based equality

### Aggregates

Aggregates are clusters of entities and value objects with a root entity.

```typescript
export class Order extends BaseAggregateRoot<OrderProps> {
  private items: OrderItem[] = [];

  addItem(item: OrderItem): void {
    this.items.push(item);
    this.addDomainEvent(new ItemAddedEvent(this.id, item));
  }

  // Aggregate root ensures invariants
  checkout(): void {
    if (this.items.length === 0) {
      throw new BusinessRuleException("Cannot checkout empty order");
    }
    this.addDomainEvent(new OrderCheckedOutEvent(this.id));
  }
}
```

**Key Characteristics**:

- Has a root entity
- Enforces business invariants
- Transaction boundary
- Publishes domain events

### Domain Events

Events represent facts that occurred in the domain.

```typescript
export class UserCreatedEvent extends BaseDomainEvent {
  readonly eventType = "user.created";

  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super(userId);
  }
}
```

**Naming Convention**: Past tense (UserCreated, OrderPlaced, PaymentProcessed)

**Usage**:

```typescript
// Publish event
this.eventBus.publish(new UserCreatedEvent(user.id, user.email));

// Handle event
@OnEvent('user.created')
async handleUserCreated(event: UserCreatedEvent) {
  await this.emailService.sendWelcomeEmail(event.email);
}
```

### Repositories

Repositories provide collection-like interface for aggregates.

```typescript
export interface UserRepository {
  // Collection-like methods
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;

  // Query methods
  findByEmail(email: string): Promise<User | null>;
  findAll(limit?: number, offset?: number): Promise<User[]>;
}
```

**Key Principles**:

- One repository per aggregate root
- Returns domain entities, not database records
- Hides persistence details

## Domain Exceptions

Type-safe error handling for domain rules.

```typescript
// Base exception
export abstract class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
  }
}

// Specific exceptions
export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super("User", identifier);
  }
}

export class UserAlreadyExistsException extends BusinessRuleException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, "USER_ALREADY_EXISTS");
  }
}
```

**Usage**:

```typescript
const user = await this.userRepository.findById(id);
if (!user) {
  throw new UserNotFoundException(id);
}
```

## Ubiquitous Language

Use domain terminology consistently across code and documentation.

**Good**:

```typescript
class Order {
  checkout(): void {}
  cancel(): void {}
  ship(): void {}
}
```

**Bad**:

```typescript
class Order {
  process(): void {} // Too generic
  remove(): void {} // Technical term
  send(): void {} // Ambiguous
}
```

## Bounded Contexts

Modules represent bounded contexts with clear boundaries.

```
modules/
├── auth/          # Authentication context
├── users/         # User management context
├── orders/        # Order management context
└── billing/       # Billing context
```

**Communication**: Use domain events to communicate between contexts.

## Example: Complete User Module

### Domain Layer

```typescript
// domain/user.entity.ts
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
}

// domain/events/user.events.ts
export class UserCreatedEvent extends BaseDomainEvent {
  readonly eventType = "user.created";
  constructor(public readonly userId: string) {
    super(userId);
  }
}
```

### Application Layer

```typescript
// application/commands/create-user.command.ts
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name?: string,
  ) {}
}

// application/commands/create-user.handler.ts
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async execute(command: CreateUserCommand): Promise<User> {
    // Check business rules
    const exists = await this.userRepository.existsByEmail(command.email);
    if (exists) {
      throw new UserAlreadyExistsException(command.email);
    }

    // Create user
    const user = await this.userRepository.create(command);

    // Publish event
    this.eventBus.publish(new UserCreatedEvent(user.id));

    return user;
  }
}
```

### Infrastructure Layer

```typescript
// infrastructure/repositories/user.repository.ts
@Injectable()
export class UserRepositoryImpl implements UserRepository {
  async create(data: CreateUserData): Promise<User> {
    const [user] = await this.db.insert(usersTable).values(data).returning();
    return this.toEntity(user);
  }
}
```

### Presentation Layer

```typescript
// presentation/controllers/users.controller.ts
@Controller("users")
export class UsersController {
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const command = new CreateUserCommand(dto.email, dto.name);
    return this.commandBus.execute(command);
  }
}
```

## Best Practices

1. **Keep Domain Pure**: Domain layer should have no framework dependencies
2. **Use Domain Events**: Decouple modules through events
3. **Enforce Invariants**: Validate business rules in domain layer
4. **Repository Per Aggregate**: One repository per aggregate root
5. **Ubiquitous Language**: Use domain terms consistently
6. **Bounded Contexts**: Clear module boundaries

## Anti-Patterns to Avoid

❌ **Anemic Domain Model**: Entities with only getters/setters
❌ **God Objects**: Entities that know too much
❌ **Leaky Abstractions**: Domain depending on infrastructure
❌ **Generic Repositories**: Repository<T> pattern
❌ **CRUD Everywhere**: Not all operations are CRUD

## Next Steps

- [Module Boundaries](./module-boundaries.md)
- [Testing Guide](./testing-guide.md)
