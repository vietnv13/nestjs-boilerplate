import { usersTable } from '@workspace/database/schemas/auth'

import type { DrizzleDb } from '@/shared-kernel/infrastructure/db/db.port'

export interface CreateUserFixture {
  email?: string
  name?: string
  password?: string
  role?: 'user' | 'admin'
}

export class UserFixtures {
  constructor(private readonly db: DrizzleDb) {}

  async createUser(data: CreateUserFixture = {}) {
    const [user] = await this.db
      .insert(usersTable)
      .values({
        email: data.email ?? `test-${Date.now()}@example.com`,
        name: data.name ?? 'Test User',
        role: data.role ?? 'user',
        emailVerified: false,
        banned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return user
  }

  async createAdmin(data: CreateUserFixture = {}) {
    return this.createUser({ ...data, role: 'admin' })
  }

  async createMultipleUsers(count: number) {
    const users = []
    for (let i = 0; i < count; i++) {
      users.push(
        await this.createUser({
          email: `user-${i}-${Date.now()}@example.com`,
          name: `User ${i}`,
        }),
      )
    }
    return users
  }
}
