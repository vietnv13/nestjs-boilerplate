import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { Inject, Injectable } from '@nestjs/common'

import type { StorageDriver, UploadBufferParams, UploadResult } from './storage.types.js'

export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER')

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_DRIVER)
    private readonly driver: StorageDriver,
  ) {}

  async uploadBuffer(params: UploadBufferParams): Promise<UploadResult> {
    const key = this.generateKey(params.filename, params.prefix)
    await this.driver.putObject(key, params.buffer, params.contentType)
    const url = await this.driver.getUrl(key)
    return { key, url }
  }

  deleteObject(key: string): Promise<void> {
    return this.driver.deleteObject(key)
  }

  getUrl(key: string): Promise<string | undefined> {
    return this.driver.getUrl(key)
  }

  private generateKey(filename?: string, prefix?: string): string {
    const id = randomUUID()
    const ext = filename ? path.extname(filename) : ''

    const safePrefix = prefix
      ? prefix
          .split('/')
          .filter((part) => part.length > 0)
          .join('/')
      : ''
    return safePrefix ? `${safePrefix}/${id}${ext}` : `${id}${ext}`
  }
}
