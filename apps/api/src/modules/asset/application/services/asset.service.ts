import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { ASSET_REPOSITORY } from '@/modules/asset/application/ports/asset.repository.port'
import { StorageService } from '@/shared-kernel/infrastructure/storage/storage.service'

import type { AssetRepository } from '@/modules/asset/application/ports/asset.repository.port'
import type { AssetDatabase, AssetLinkDatabase } from '@workspace/database'

export interface CreateAssetParams {
  buffer: Buffer
  filename?: string
  contentType?: string
  isPublic: boolean
  creatorId?: string
}

export interface LinkAssetParams {
  ownerType: string
  ownerId: string
  slot?: string
}

export interface CreateAssetResult {
  asset: AssetDatabase
  url?: string
}

@Injectable()
export class AssetService {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly repo: AssetRepository,
    private readonly storage: StorageService,
  ) {}

  async createAsset(params: CreateAssetParams): Promise<CreateAssetResult> {
    if (!params.isPublic && !params.creatorId) {
      throw new BadRequestException('Authenticated upload is required for non-public assets')
    }

    if (params.isPublic && params.creatorId) {
      throw new BadRequestException('Public assets cannot have a creator')
    }

    const prefix = params.isPublic ? 'assets/public' : `assets/users/${params.creatorId}`
    const upload = await this.storage.uploadBuffer({
      buffer: params.buffer,
      filename: params.filename,
      contentType: params.contentType,
      prefix,
    })

    const asset = await this.repo.createAsset({
      key: upload.key,
      originalFilename: params.filename ?? null,
      contentType: params.contentType ?? null,
      size: params.buffer.length,
      isPublic: params.isPublic,
      creatorId: params.creatorId ?? null,
    })

    return { asset, url: upload.url }
  }

  async linkAsset(assetId: string, params: LinkAssetParams): Promise<AssetLinkDatabase> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Asset not found')
    }

    const slot = normalizeSlot(params.slot)

    return await this.repo.createLink({
      assetId: asset.id,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      slot,
    })
  }

  async setOwnerSlotAsset(
    assetId: string,
    params: { ownerType: string; ownerId: string; slot: string },
  ): Promise<AssetLinkDatabase> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Asset not found')
    }

    const slot = normalizeSlot(params.slot)
    await this.repo.softDeleteLinksForOwnerSlot({
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      slot,
      deletedAt: new Date(),
    })

    return await this.repo.createLink({
      assetId: asset.id,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      slot,
    })
  }

  async unlinkAsset(assetId: string, params: LinkAssetParams): Promise<number> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset) {
      throw new NotFoundException('Asset not found')
    }

    const trimmedSlot = params.slot?.trim()
    let slot: string | undefined
    if (trimmedSlot) slot = trimmedSlot
    return await this.repo.softDeleteLinksByOwner({
      assetId,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      slot,
      deletedAt: new Date(),
    })
  }

  async getAssetUrl(assetId: string): Promise<string | undefined> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset || asset.deletedAt) {
      throw new NotFoundException('Asset not found')
    }
    return await this.storage.getUrl(asset.key)
  }

  async softDeleteAsset(assetId: string, actorId: string): Promise<void> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset) {
      throw new NotFoundException('Asset not found')
    }

    if (!asset.creatorId) {
      throw new ForbiddenException('Only creator-owned assets can be deleted via API')
    }

    if (asset.creatorId !== actorId) {
      throw new ForbiddenException('You do not have permission to delete this asset')
    }

    if (asset.deletedAt) {
      return
    }

    const now = new Date()
    await this.repo.softDeleteLinksByAssetId(assetId, now)
    await this.repo.softDeleteAsset(assetId, now)
  }

  async purgeExpiredAssets(params: {
    cutoff: Date
    limit?: number
  }): Promise<{ purged: number; failed: number }> {
    const candidates = await this.repo.findPurgeCandidates(params.cutoff, params.limit ?? 200)
    let purged = 0
    let failed = 0

    for (const asset of candidates) {
      try {
        await this.storage.deleteObject(asset.key)
      } catch {
        failed++
        continue
      }

      const deleted = await this.repo.hardDeleteAsset(asset.id)
      if (deleted) purged++
    }

    return { purged, failed }
  }
}

function normalizeSlot(value?: string): string {
  const trimmed = value?.trim()
  if (!trimmed) return 'default'
  return trimmed
}
