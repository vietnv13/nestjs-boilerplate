import { Inject, Injectable } from '@nestjs/common'
import { accountsTable } from '@workspace/database'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import { eq, and } from 'drizzle-orm'

import type { AccountDatabase, AuthProvider } from '@workspace/database'
import type { DrizzleDb } from '@workspace/nestjs-drizzle'

/**
 * Drizzle AuthIdentity Repository implementation
 *
 * Manages persistence of multi-method authentication identities.
 * Compatible with better-auth accounts table.
 */
@Injectable()
export class AuthIdentityRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(identity: AccountDatabase): Promise<void> {
    const result = await this.db
      .update(accountsTable)
      .set({ ...identity, updatedAt: new Date() })
      .where(eq(accountsTable.id, identity.id))

    if ((result.rowCount ?? 0) > 0) return

    await this.db.insert(accountsTable).values({
      ...identity,
      createdAt: identity.createdAt ?? new Date(),
      updatedAt: new Date(),
    })
  }

  async findById(id: string): Promise<AccountDatabase | null> {
    const result = await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, id))
      .limit(1)

    return result[0] ?? null
  }

  async findByUserId(userId: string): Promise<AccountDatabase[]> {
    return this.db.select().from(accountsTable).where(eq(accountsTable.userId, userId))
  }

  async findByUserIdAndProvider(
    userId: string,
    provider: AuthProvider,
  ): Promise<AccountDatabase | null> {
    const result = await this.db
      .select()
      .from(accountsTable)
      .where(and(eq(accountsTable.userId, userId), eq(accountsTable.providerId, provider)))
      .limit(1)

    return result[0] ?? null
  }

  async findByProviderAndIdentifier(
    provider: AuthProvider,
    accountId: string,
  ): Promise<AccountDatabase | null> {
    const result = await this.db
      .select()
      .from(accountsTable)
      .where(
        and(
          eq(accountsTable.providerId, provider),
          eq(accountsTable.accountId, accountId.toLowerCase()),
        ),
      )
      .limit(1)

    return result[0] ?? null
  }

  async existsByIdentifier(accountId: string): Promise<boolean> {
    const result = await this.db
      .select({ id: accountsTable.id })
      .from(accountsTable)
      .where(eq(accountsTable.accountId, accountId.toLowerCase()))
      .limit(1)

    return result.length > 0
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(accountsTable).where(eq(accountsTable.id, id))
    return (result.rowCount ?? 0) > 0
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.db.delete(accountsTable).where(eq(accountsTable.userId, userId))
    return result.rowCount ?? 0
  }
}
