import { Injectable, Inject } from '@nestjs/common'
import { usersTable } from '@workspace/database'
import { eq } from 'drizzle-orm'

import { CacheKeyGenerator } from '@/shared-kernel/infrastructure/cache/cache-key.generator'
import { CacheService } from '@/shared-kernel/infrastructure/cache/cache.service'
import { DB_TOKEN } from '@/shared-kernel/infrastructure/db/db.port'

import type { UserRepository } from '@/modules/user/application/ports/user.repository.port'
import type {
  User,
  CreateUserData,
  UpdateUserData,
} from '@/modules/user/domain/entities/user.entity'
import type { DrizzleDb } from '@/shared-kernel/infrastructure/db/db.port'

type UserRow = typeof usersTable.$inferSelect

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
    private readonly cacheService: CacheService,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const rows = await this.db
      .insert(usersTable)
      .values({
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name ?? '',
        role: data.role ?? 'user',
        emailVerified: false,
        banned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    const entity = this.toEntity(rows[0]!)
    await this.cacheUser(entity)
    return entity
  }

  async findById(id: string): Promise<User | null> {
    return this.cacheService.getOrSet(CacheKeyGenerator.user(id), async () => {
      const result = await this.db.select().from(usersTable).where(eq(usersTable.id, id))
      return result.length === 0 ? null : this.toEntity(result[0]!)
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.cacheService.getOrSet(
      CacheKeyGenerator.userByEmail(email),
      async () => {
        const result = await this.db.select().from(usersTable).where(eq(usersTable.email, email))
        return result.length === 0 ? null : this.toEntity(result[0]!)
      },
    )

    if (user) {
      await this.cacheService.set(CacheKeyGenerator.user(user.id), user)
    }

    return user
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const rows = await this.db
      .update(usersTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning()

    if (rows.length === 0) return null

    const entity = this.toEntity(rows[0]!)
    await this.cacheUser(entity)
    return entity
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

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    const results = await this.db.select().from(usersTable).limit(limit).offset(offset)
    return results.map((r) => this.toEntity(r))
  }

  async existsByEmail(email: string): Promise<boolean> {
    const cached = await this.cacheService.get<User>(CacheKeyGenerator.userByEmail(email))
    if (cached) return true

    const result = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))

    return result.length > 0
  }

  private toEntity(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: (row.role ?? 'user') as 'user' | 'admin',
      emailVerified: row.emailVerified,
      image: row.image,
      banned: row.banned ?? false,
      banReason: row.banReason,
      banExpires: row.banExpires,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private async cacheUser(user: User): Promise<void> {
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
