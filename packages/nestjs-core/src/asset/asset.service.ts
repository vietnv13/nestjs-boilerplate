import { Injectable } from '@nestjs/common'
import { createHttpException, ErrorCode } from '@workspace/error-code'
import { StorageService } from '@workspace/nestjs-storage'

import { AssetRepository } from './asset.repository.js'

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
    private readonly repo: AssetRepository,
    private readonly storage: StorageService,
  ) {}

  async createAsset(params: CreateAssetParams): Promise<CreateAssetResult> {
    if (!params.isPublic && !params.creatorId) {
      throw createHttpException(ErrorCode.ASSET_UPLOAD_AUTH_REQUIRED)
    }

    if (params.isPublic && params.creatorId) {
      throw createHttpException(ErrorCode.ASSET_PUBLIC_CANNOT_HAVE_CREATOR)
    }

    const datePath = buildDatePath()
    const prefix = `assets/${datePath}`

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
      throw createHttpException(ErrorCode.ASSET_NOT_FOUND)
    }

    const slot = normalizeSlot(params.slot)

    return this.repo.createLink({
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
      throw createHttpException(ErrorCode.ASSET_NOT_FOUND)
    }

    const slot = normalizeSlot(params.slot)
    await this.repo.softDeleteLinksForOwnerSlot({
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      slot,
      deletedAt: new Date(),
    })

    return this.repo.createLink({
      assetId: asset.id,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      slot,
    })
  }

  async unlinkAsset(assetId: string, params: LinkAssetParams): Promise<number> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset) {
      throw createHttpException(ErrorCode.ASSET_NOT_FOUND)
    }

    const trimmedSlot = params.slot?.trim()
    return this.repo.softDeleteLinksByOwner({
      assetId,
      ownerType: params.ownerType,
      ownerId: params.ownerId,
      slot: trimmedSlot?.length ? trimmedSlot : undefined,
      deletedAt: new Date(),
    })
  }

  async getAssetUrl(assetId: string): Promise<string | undefined> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset || asset.deletedAt) {
      throw createHttpException(ErrorCode.ASSET_NOT_FOUND)
    }
    return this.storage.getUrl(asset.key)
  }

  async softDeleteAsset(assetId: string, actorId: string): Promise<void> {
    const asset = await this.repo.findAssetById(assetId)
    if (!asset) {
      throw createHttpException(ErrorCode.ASSET_NOT_FOUND)
    }

    if (!asset.creatorId) {
      throw createHttpException(ErrorCode.ASSET_DELETE_CREATOR_ONLY)
    }

    if (asset.creatorId !== actorId) {
      throw createHttpException(ErrorCode.ASSET_DELETE_FORBIDDEN)
    }

    if (asset.deletedAt) {
      return
    }

    const now = new Date()
    await this.repo.softDeleteLinksByAssetId(assetId, now)
    await this.repo.softDeleteAsset(assetId, now)
  }

  async getLinksForOwner(params: {
    ownerType: string
    ownerId: string
    slot?: string
  }): Promise<AssetLinkDatabase[]> {
    return this.repo.findLinksByOwner(params)
  }

  async getUrlForOwnerSlot(params: {
    ownerType: string
    ownerId: string
    slot: string
  }): Promise<string | undefined> {
    const [link] = await this.repo.findLinksByOwner(params)
    if (!link) return undefined
    const asset = await this.repo.findAssetById(link.assetId)
    if (!asset || asset.deletedAt) return undefined
    return this.storage.getUrl(asset.key)
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

function buildDatePath(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hour = String(now.getUTCHours()).padStart(2, '0')
  return `${year}/${month}/${day}/${hour}`
}

function normalizeSlot(value?: string): string {
  const trimmed = value?.trim()
  if (!trimmed) return 'default'
  return trimmed
}
