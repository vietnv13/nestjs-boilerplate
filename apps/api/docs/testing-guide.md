# Testing Guide

## Testing Strategy

This project uses a comprehensive testing strategy with multiple test types.

## Test Types

### Unit Tests

Test individual components in isolation.

**Location**: `src/**/*.spec.ts`

**Example**:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { CreateUserHandler } from "./create-user.handler";

describe("CreateUserHandler", () => {
  let handler: CreateUserHandler;
  let mockRepository: MockType<UserRepository>;
  let mockEventBus: MockType<EventBus>;

  beforeEach(() => {
    mockRepository = createMock<UserRepository>();
    mockEventBus = createMock<EventBus>();
    handler = new CreateUserHandler(mockRepository, mockEventBus);
  });

  it("should create a user", async () => {
    const command = new CreateUserCommand("test@example.com", "Test User");
    mockRepository.existsByEmail.mockResolvedValue(false);
    mockRepository.create.mockResolvedValue({ id: "1", ...command });

    const result = await handler.execute(command);

    expect(result.email).toBe(command.email);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "user.created" }),
    );
  });

  it("should throw if user already exists", async () => {
    const command = new CreateUserCommand("existing@example.com");
    mockRepository.existsByEmail.mockResolvedValue(true);

    await expect(handler.execute(command)).rejects.toThrow(UserAlreadyExistsException);
  });
});
```

**Run**:

```bash
pnpm test
pnpm test:watch  # Watch mode
pnpm test:cov    # With coverage
```

### Integration Tests

Test multiple components working together with a real database.

**Location**: `test/integration/**/*.spec.ts`

**Example**:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { testDb } from "../setup/test-database";
import { TestModuleBuilder } from "../setup/test-module";
import { UserRepositoryImpl } from "@/modules/users/infrastructure/repositories/user.repository";

describe("UserRepository Integration Tests", () => {
  let userRepository: UserRepositoryImpl;

  beforeEach(async () => {
    const module = await TestModuleBuilder.createTestingModule([], [UserRepositoryImpl]);
    userRepository = module.get<UserRepositoryImpl>(UserRepositoryImpl);
  });

  it("should create and retrieve a user", async () => {
    const userData = {
      email: "test@example.com",
      name: "Test User",
      role: "user" as const,
    };

    const created = await userRepository.create(userData);
    const found = await userRepository.findById(created.id);

    expect(found).toBeDefined();
    expect(found?.email).toBe(userData.email);
  });
});
```

**Run**:

```bash
pnpm test:integration
```

**Setup**: Uses Testcontainers to spin up a PostgreSQL container for each test run.

### E2E Tests

Test complete user flows through HTTP endpoints.

**Location**: `test/e2e/**/*.spec.ts`

**Example**:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "@/app.module";

describe("Users E2E", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /users - should create a user", async () => {
    const response = await request(app.getHttpServer())
      .post("/users")
      .send({
        email: "newuser@example.com",
        name: "New User",
      })
      .expect(201);

    expect(response.body).toMatchObject({
      email: "newuser@example.com",
      name: "New User",
    });
  });

  it("GET /users/:id - should retrieve a user", async () => {
    // Create user first
    const createResponse = await request(app.getHttpServer())
      .post("/users")
      .send({ email: "getuser@example.com" });

    const userId = createResponse.body.id;

    // Retrieve user
    const response = await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);

    expect(response.body.id).toBe(userId);
  });
});
```

**Run**:

```bash
pnpm test:e2e
```

## Test Infrastructure

### Test Database Setup

Integration tests use Testcontainers for isolated database instances:

```typescript
// test/integration/setup/test-database.ts
export class TestDatabase {
  private container: StartedPostgreSqlContainer;
  public db: DrizzleDb;

  async setup(): Promise<void> {
    this.container = await new PostgreSqlContainer("postgres:18-alpine")
      .withDatabase("test_db")
      .start();

    const pool = new Pool({
      connectionString: this.container.getConnectionUri(),
    });

    this.db = drizzle(pool, { schema });
    await migrate(this.db, { migrationsFolder: "./drizzle" });
  }

  async cleanup(): Promise<void> {
    // Clear all tables between tests
  }

  async teardown(): Promise<void> {
    await this.container.stop();
  }
}
```

### Test Fixtures

Reusable test data factories:

```typescript
// test/fixtures/user.fixtures.ts
export class UserFixtures {
  constructor(private readonly db: DrizzleDb) {}

  async createUser(data: Partial<CreateUserData> = {}) {
    return this.db
      .insert(usersTable)
      .values({
        email: data.email ?? `test-${Date.now()}@example.com`,
        name: data.name ?? "Test User",
        role: data.role ?? "user",
      })
      .returning();
  }

  async createAdmin() {
    return this.createUser({ role: "admin" });
  }
}
```

**Usage**:

```typescript
const fixtures = new UserFixtures(testDb.db);
const user = await fixtures.createUser({ email: "specific@example.com" });
```

## Mocking

### Repository Mocks

```typescript
import { createMock } from "@golevelup/ts-vitest";

const mockRepository = createMock<UserRepository>({
  findById: vi.fn().mockResolvedValue(mockUser),
  create: vi.fn().mockResolvedValue(mockUser),
});
```

### Event Bus Mocks

```typescript
const mockEventBus = createMock<EventBus>({
  publish: vi.fn(),
});

// Verify event was published
expect(mockEventBus.publish).toHaveBeenCalledWith(
  expect.objectContaining({ eventType: "user.created" }),
);
```

## Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it("should do something", async () => {
  // Arrange
  const input = { email: "test@example.com" };
  mockRepository.findByEmail.mockResolvedValue(null);

  // Act
  const result = await handler.execute(input);

  // Assert
  expect(result).toBeDefined();
  expect(mockRepository.create).toHaveBeenCalledWith(input);
});
```

### 2. Test Behavior, Not Implementation

**Good**:

```typescript
it("should send welcome email when user is created", async () => {
  await createUser({ email: "test@example.com" });
  expect(mockEmailService.send).toHaveBeenCalled();
});
```

**Bad**:

```typescript
it("should call repository.create", async () => {
  await createUser({ email: "test@example.com" });
  expect(mockRepository.create).toHaveBeenCalled(); // Testing implementation
});
```

### 3. Use Descriptive Test Names

```typescript
// Good
it("should throw UserNotFoundException when user does not exist", () => {});

// Bad
it("should throw error", () => {});
```

### 4. One Assertion Per Test (When Possible)

```typescript
// Good
it("should return user with correct email", async () => {
  const user = await createUser({ email: "test@example.com" });
  expect(user.email).toBe("test@example.com");
});

it("should return user with correct role", async () => {
  const user = await createUser({ role: "admin" });
  expect(user.role).toBe("admin");
});
```

### 5. Clean Up After Tests

```typescript
afterEach(async () => {
  await testDb.cleanup(); // Clear database
  vi.clearAllMocks(); // Clear mock calls
});
```

## Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

**Check Coverage**:

```bash
pnpm test:cov
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Main branch commits
- Pre-deployment

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:integration
      - run: pnpm test:e2e
```

## Debugging Tests

### VSCode Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--run", "--no-coverage"],
  "console": "integratedTerminal"
}
```

### Running Specific Tests

```bash
# Run specific file
pnpm test user.repository.spec.ts

# Run tests matching pattern
pnpm test --grep "should create user"
```

## Next Steps

- [API Usage Examples](./api-usage.md)
- [Error Codes Reference](./error-codes.md)
