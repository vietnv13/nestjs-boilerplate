import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { StorageDriver } from '../storage.types.js'

export class LocalStorageDriver implements StorageDriver {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl?: string,
    private readonly publicPathPrefix: string = '/uploads',
  ) {}

  async putObject(key: string, buffer: Buffer): Promise<void> {
    const absPath = this.resolveKeyToPath(key)
    await mkdir(path.dirname(absPath), { recursive: true })
    await writeFile(absPath, buffer)
  }

  async deleteObject(key: string): Promise<void> {
    const absPath = this.resolveKeyToPath(key)
    try {
      await unlink(absPath)
    } catch (error) {
      const errno = error as NodeJS.ErrnoException
      if (errno.code === 'ENOENT') return
      throw error
    }
  }

  getUrl(key: string): Promise<string | undefined> {
    const path = `${this.publicPathPrefix}/${key}`
    if (!this.publicBaseUrl) return Promise.resolve(path)
    return Promise.resolve(`${this.publicBaseUrl.replace(/\/+$/, '')}${path}`)
  }

  private resolveKeyToPath(key: string): string {
    const rootAbs = path.resolve(this.rootDir)
    const target = path.resolve(path.join(rootAbs, key))

    // Prevent path traversal: target must remain under rootDir.
    if (!target.startsWith(`${rootAbs}/`) && target !== rootAbs) {
      throw new Error('Invalid storage key')
    }

    return target
  }
}
