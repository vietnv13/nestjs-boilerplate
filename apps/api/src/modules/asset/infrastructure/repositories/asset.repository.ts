import { Inject, Injectable } from '@nestjs/common'
import { assetLinksTable, assetsTable } from '@workspace/database'
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm'

import { DB_TOKEN } from '@workspace/nestjs-drizzle'

import type {
  AssetRepository,
  PurgeCandidate,
} from '@/modules/asset/application/ports/asset.repository.port'
import type { DrizzleDb } from '@workspace/nestjs-drizzle'
import type {
  AssetDatabase,
  AssetLinkDatabase,
  InsertAssetDatabase,
  InsertAssetLinkDatabase,
} from '@workspace/database'

@Injectable()
export class AssetRepositoryImpl implements AssetRepository {
  constructor(@Inject(DB_TOKEN) private readonly db: DrizzleDb) {}

  async createAsset(
    data: Omit<InsertAssetDatabase, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<AssetDatabase> {
    const [asset] = await this.db.insert(assetsTable).values(data).returning()

    if (!asset) {
      throw new Error('Failed to create asset')
    }

    return asset
  }

  async findAssetById(id: string): Promise<AssetDatabase | null> {
    const [asset] = await this.db.select().from(assetsTable).where(eq(assetsTable.id, id)).limit(1)
    return asset ?? null
  }

  async softDeleteAsset(id: string, deletedAt: Date): Promise<boolean> {
    const result = await this.db
      .update(assetsTable)
      .set({ deletedAt })
      .where(and(eq(assetsTable.id, id), isNull(assetsTable.deletedAt)))

    return (result.rowCount ?? 0) > 0
  }

  async createLink(
    data: Omit<InsertAssetLinkDatabase, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<AssetLinkDatabase> {
    const [link] = await this.db.insert(assetLinksTable).values(data).returning()

    if (!link) {
      throw new Error('Failed to create asset link')
    }

    return link
  }

  async softDeleteLinksByAssetId(assetId: string, deletedAt: Date): Promise<number> {
    const result = await this.db
      .update(assetLinksTable)
      .set({ deletedAt })
      .where(and(eq(assetLinksTable.assetId, assetId), isNull(assetLinksTable.deletedAt)))

    return result.rowCount ?? 0
  }

  async softDeleteLinksByOwner(params: {
    assetId: string
    ownerType: string
    ownerId: string
    slot?: string
    deletedAt: Date
  }): Promise<number> {
    const conditions = [
      eq(assetLinksTable.assetId, params.assetId),
      eq(assetLinksTable.ownerType, params.ownerType),
      eq(assetLinksTable.ownerId, params.ownerId),
      isNull(assetLinksTable.deletedAt),
    ]

    if (params.slot) {
      conditions.push(eq(assetLinksTable.slot, params.slot))
    }

    const where = and(...conditions)

    const result = await this.db
      .update(assetLinksTable)
      .set({ deletedAt: params.deletedAt })
      .where(where)
    return result.rowCount ?? 0
  }

  async softDeleteLinksForOwnerSlot(params: {
    ownerType: string
    ownerId: string
    slot: string
    deletedAt: Date
  }): Promise<number> {
    const result = await this.db
      .update(assetLinksTable)
      .set({ deletedAt: params.deletedAt })
      .where(
        and(
          eq(assetLinksTable.ownerType, params.ownerType),
          eq(assetLinksTable.ownerId, params.ownerId),
          eq(assetLinksTable.slot, params.slot),
          isNull(assetLinksTable.deletedAt),
        ),
      )

    return result.rowCount ?? 0
  }

  async findLinksByOwner(params: {
    ownerType: string
    ownerId: string
    slot?: string
  }): Promise<AssetLinkDatabase[]> {
    const conditions = [
      eq(assetLinksTable.ownerType, params.ownerType),
      eq(assetLinksTable.ownerId, params.ownerId),
      isNull(assetLinksTable.deletedAt),
    ]

    if (params.slot) {
      conditions.push(eq(assetLinksTable.slot, params.slot))
    }

    return await this.db
      .select()
      .from(assetLinksTable)
      .where(and(...conditions))
  }

  async findPurgeCandidates(cutoff: Date, limit: number): Promise<PurgeCandidate[]> {
    const rows = await this.db
      .select({ id: assetsTable.id, key: assetsTable.key })
      .from(assetsTable)
      .where(
        or(
          // Soft deleted long ago
          sql`${assetsTable.deletedAt} IS NOT NULL AND ${assetsTable.deletedAt} < ${cutoff}`,
          // Never linked and old enough
          and(
            isNull(assetsTable.deletedAt),
            lt(assetsTable.createdAt, cutoff),
            sql`NOT EXISTS (
              SELECT 1
              FROM ${assetLinksTable} al
              WHERE al.asset_id = ${assetsTable.id}
                AND al.deleted_at IS NULL
            )`,
          ),
        ),
      )
      .limit(limit)

    return rows
  }

  async hardDeleteAsset(id: string): Promise<boolean> {
    const result = await this.db.delete(assetsTable).where(eq(assetsTable.id, id))
    return (result.rowCount ?? 0) > 0
  }
}
