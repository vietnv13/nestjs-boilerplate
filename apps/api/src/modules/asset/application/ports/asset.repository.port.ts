import type {
  AssetDatabase,
  AssetLinkDatabase,
  InsertAssetDatabase,
  InsertAssetLinkDatabase,
} from '@workspace/database'

export interface PurgeCandidate {
  id: string
  key: string
}

export interface AssetRepository {
  createAsset(
    data: Omit<InsertAssetDatabase, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<AssetDatabase>
  findAssetById(id: string): Promise<AssetDatabase | null>
  softDeleteAsset(id: string, deletedAt: Date): Promise<boolean>

  createLink(
    data: Omit<InsertAssetLinkDatabase, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<AssetLinkDatabase>
  softDeleteLinksByAssetId(assetId: string, deletedAt: Date): Promise<number>
  softDeleteLinksByOwner(params: {
    assetId: string
    ownerType: string
    ownerId: string
    slot?: string
    deletedAt: Date
  }): Promise<number>
  softDeleteLinksForOwnerSlot(params: {
    ownerType: string
    ownerId: string
    slot: string
    deletedAt: Date
  }): Promise<number>

  findPurgeCandidates(cutoff: Date, limit: number): Promise<PurgeCandidate[]>
  hardDeleteAsset(id: string): Promise<boolean>
}

export const ASSET_REPOSITORY = Symbol('ASSET_REPOSITORY')
