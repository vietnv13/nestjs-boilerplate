import { Inject, Injectable } from '@nestjs/common'
import { sessionsTable } from '@workspace/database'
import { DB_TOKEN } from '@workspace/nestjs-drizzle'
import { eq, lt } from 'drizzle-orm'

import type { SessionDatabase } from '@workspace/database'
import type { DrizzleDb } from '@workspace/nestjs-drizzle'

@Injectable()
export class AuthSessionRepository {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(session: SessionDatabase): Promise<void> {
    const data = {
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      updatedAt: new Date(),
    }

    const existing = await this.findById(session.id)

    await (existing
      ? this.db
          .update(sessionsTable)
          .set({
            expiresAt: session.expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(sessionsTable.id, session.id))
      : this.db.insert(sessionsTable).values(data))
  }

  async findById(id: string): Promise<SessionDatabase | null> {
    const result = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return result[0]!
  }

  async findByToken(token: string): Promise<SessionDatabase | null> {
    const result = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.token, token))
      .limit(1)

    if (result.length === 0) {
      return null
    }

    return result[0]!
  }

  async findActiveByUserId(userId: string): Promise<SessionDatabase[]> {
    const now = new Date()
    const results = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, userId))

    return results.filter((session) => session.expiresAt > now)
  }

  async findAllByUserId(userId: string): Promise<SessionDatabase[]> {
    const results = await this.db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, userId))

    return results
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(sessionsTable).where(eq(sessionsTable.id, id))

    return (result.rowCount ?? 0) > 0
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.db.delete(sessionsTable).where(eq(sessionsTable.userId, userId))

    return result.rowCount ?? 0
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db
      .delete(sessionsTable)
      .where(lt(sessionsTable.expiresAt, new Date()))

    return result.rowCount ?? 0
  }
}
