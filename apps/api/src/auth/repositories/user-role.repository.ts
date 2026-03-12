import { Inject, Injectable } from '@nestjs/common'
import { usersTable } from '@workspace/database'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import { eq } from 'drizzle-orm'

import type { DrizzleDb } from '@workspace/nestjs-drizzle'

export type Role = 'user' | 'admin'

/**
 * Drizzle UserRole Repository implementation
 *
 * Single role management (compatible with better-auth usersTable.role field)
 */
@Injectable()
export class UserRoleRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async setRole(userId: string, role: Role | null): Promise<void> {
    await this.db
      .update(usersTable)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
  }

  async getRole(userId: string): Promise<Role | null> {
    const result = await this.db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return result[0]!.role as Role | null
  }

  async hasRole(userId: string, role: Role): Promise<boolean> {
    const userRole = await this.getRole(userId)
    return userRole === role
  }

  async getUserIdsByRole(role: Role): Promise<string[]> {
    const results = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, role))

    return results.map((r) => r.id)
  }
}
