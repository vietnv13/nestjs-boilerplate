import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { usersTable } from "@workspace/database";
import { DB_TOKEN, type DrizzleDb } from "@/shared-kernel/infrastructure/db/db.port";
import type { UserRepository } from "../../application/ports/user.repository.port";
import type { User, CreateUserData, UpdateUserData } from "../../domain/user.entity";
import { CacheService } from "@/shared-kernel/infrastructure/cache/cache.service";
import { CacheKeyGenerator } from "@/shared-kernel/infrastructure/cache/cache-key.generator";

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
    private readonly cacheService: CacheService,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const [user] = await this.db
      .insert(usersTable)
      .values({
        id: crypto.randomUUID(),
        email: data.email,
        name: data.name ?? "",
        role: data.role ?? "user",
        emailVerified: false,
        banned: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const entity = this.toEntity(user as any);

    // Cache the new user
    await this.cacheUser(entity);

    return entity;
  }

  async findById(id: string): Promise<User | null> {
    const cacheKey = CacheKeyGenerator.user(id);

    return this.cacheService.getOrSet(cacheKey, async () => {
      const result = await this.db.select().from(usersTable).where(eq(usersTable.id, id));

      if (result.length === 0) {
        return null;
      }

      return this.toEntity(result[0] as any);
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = CacheKeyGenerator.userByEmail(email);

    const user = await this.cacheService.getOrSet(cacheKey, async () => {
      const result = await this.db.select().from(usersTable).where(eq(usersTable.email, email));

      if (result.length === 0) {
        // Return null if not found (cache service handles null/undefined differently depending on implementation basic cache manager might not cache undefined)
        // In our wrapper case, we return what factory returns
        return null;
      }

      return this.toEntity(result[0] as any);
    });

    // Also cache by ID if found via email
    if (user) {
      await this.cacheService.set(CacheKeyGenerator.user(user.id), user);
    }

    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const [updated] = await this.db
      .update(usersTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) {
      return null;
    }

    const entity = this.toEntity(updated as any);

    // Update cache
    await this.cacheUser(entity);

    return entity;
  }

  async delete(id: string): Promise<boolean> {
    // Get user first to invalidate email cache
    const user = await this.findById(id);

    const result = await this.db.delete(usersTable).where(eq(usersTable.id, id)).returning();
    const deleted = result.length > 0;

    if (deleted && user) {
      await this.invalidateUserCache(user.id, user.email);
    }

    return deleted;
  }

  async findAll(limit: number = 10, offset: number = 0): Promise<User[]> {
    const results = await this.db.select().from(usersTable).limit(limit).offset(offset);

    return results.map((r) => this.toEntity(r as any));
  }

  async existsByEmail(email: string): Promise<boolean> {
    // Check cache first
    const cachedUser = await this.cacheService.get<User>(CacheKeyGenerator.userByEmail(email));
    if (cachedUser) {
      return true;
    }

    const result = await this.db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email));

    return result.length > 0;
  }

  private toEntity(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      emailVerified: row.emailVerified,
      image: row.image,
      banned: row.banned,
      banReason: row.banReason,
      banExpires: row.banExpires,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async cacheUser(user: User): Promise<void> {
    await Promise.all([
      this.cacheService.set(CacheKeyGenerator.user(user.id), user),
      this.cacheService.set(CacheKeyGenerator.userByEmail(user.email), user),
    ]);
  }

  private async invalidateUserCache(userId: string, email: string): Promise<void> {
    await Promise.all([
      this.cacheService.del(CacheKeyGenerator.user(userId)),
      this.cacheService.del(CacheKeyGenerator.userByEmail(email)),
    ]);
  }
}
