import { beforeAll, afterAll, afterEach } from "vitest";

import { testDb } from "./test-database";

// Setup test database before all tests
beforeAll(async () => {
  await testDb.setup();
}, 60_000); // 60 second timeout for container startup

// Cleanup after each test
afterEach(async () => {
  await testDb.cleanup();
});

// Teardown test database after all tests
afterAll(async () => {
  await testDb.teardown();
});
