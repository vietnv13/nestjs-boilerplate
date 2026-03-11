import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import type { StorageDriver } from '@/shared-kernel/infrastructure/storage/storage.types'

export interface S3StorageDriverOptions {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  endpoint?: string
  forcePathStyle?: boolean
  publicBaseUrl?: string
  signedUrlExpiresSec: number
}

export class S3StorageDriver implements StorageDriver {
  private readonly client: S3Client

  constructor(private readonly opts: S3StorageDriverOptions) {
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: opts.forcePathStyle,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
        sessionToken: opts.sessionToken,
      },
    })
  }

  async putObject(key: string, buffer: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.opts.bucket,
        Key: normalizeKey(key),
        Body: buffer,
        ContentType: contentType,
      }),
    )
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.opts.bucket,
          Key: normalizeKey(key),
        }),
      )
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode
      if (status === 404) return
      throw error
    }
  }

  async getUrl(key: string): Promise<string | undefined> {
    if (this.opts.publicBaseUrl) {
      return `${this.opts.publicBaseUrl.replace(/\/+$/, '')}/${normalizeKey(key)}`
    }
    return this.getSignedGetUrl(key, this.opts.signedUrlExpiresSec)
  }

  private async getSignedGetUrl(key: string, expiresSec: number): Promise<string> {
    const signedUrl = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.opts.bucket,
        Key: normalizeKey(key),
      }),
      { expiresIn: expiresSec },
    )
    return String(signedUrl)
  }
}

function normalizeKey(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value
}
