import { randomUUID } from 'node:crypto'

import { Injectable, Inject } from '@nestjs/common'
import { usersTable } from '@workspace/database'
import { CacheKeyGenerator, CacheService } from '@workspace/nestjs-cache'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import { eq } from 'drizzle-orm'

import type { DrizzleDb } from '@workspace/nestjs-drizzle'

type UserRow = typeof usersTable.$inferSelect

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
    private readonly cacheService: CacheService,
  ) {}

  async create(data: { email: string; name?: string; role?: 'user' | 'admin' }): Promise<UserRow> {
    const rows = await this.db
      .insert(usersTable)
      .values({
        id: randomUUID(),
        email: data.email,
        name: data.name ?? '',
        role: data.role ?? 'user',
        emailVerified: false,
        banned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    const user = rows[0]!
    await this.cacheUser(user)
    return user
  }

  async findById(id: string): Promise<UserRow | null> {
    return this.cacheService.getOrSet(CacheKeyGenerator.user(id), async () => {
      const result = await this.db.select().from(usersTable).where(eq(usersTable.id, id))
      return result.length === 0 ? null : result[0]!
    })
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const user = await this.cacheService.getOrSet(
      CacheKeyGenerator.userByEmail(email),
      async () => {
        const result = await this.db.select().from(usersTable).where(eq(usersTable.email, email))
        return result.length === 0 ? null : result[0]!
      },
    )

    if (user) {
      await this.cacheService.set(CacheKeyGenerator.user(user.id), user)
    }

    return user
  }

  async update(id: string, data: Partial<UserRow>): Promise<UserRow | null> {
    const rows = await this.db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning()

    if (rows.length === 0) return null

    const user = rows[0]!
    await this.cacheUser(user)
    return user
  }

  async delete(id: string): Promise<boolean> {
    const user = await this.findById(id)
    const result = await this.db.delete(usersTable).where(eq(usersTable.id, id)).returning()
    const deleted = result.length > 0

    if (deleted && user) {
      await this.invalidateUserCache(user.id, user.email)
    }

    return deleted
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<UserRow[]> {
    const results = await this.db.select().from(usersTable).limit(limit).offset(offset)
    return results
  }

  async existsByEmail(email: string): Promise<boolean> {
    const cached = await this.cacheService.get<UserRow>(CacheKeyGenerator.userByEmail(email))
    if (cached) return true

    const result = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))

    return result.length > 0
  }

  private async cacheUser(user: UserRow): Promise<void> {
    await Promise.all([
      this.cacheService.set(CacheKeyGenerator.user(user.id), user),
      this.cacheService.set(CacheKeyGenerator.userByEmail(user.email), user),
    ])
  }

  private async invalidateUserCache(userId: string, email: string): Promise<void> {
    await Promise.all([
      this.cacheService.del(CacheKeyGenerator.user(userId)),
      this.cacheService.del(CacheKeyGenerator.userByEmail(email)),
    ])
  }
}
