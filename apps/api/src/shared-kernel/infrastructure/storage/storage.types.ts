export type StorageDriverName = 'local' | 's3'

export interface UploadResult {
  key: string
  url?: string
}

export interface UploadBufferParams {
  buffer: Buffer
  contentType?: string
  filename?: string
  prefix?: string
}

export interface StorageDriver {
  putObject(key: string, buffer: Buffer, contentType?: string): Promise<void>
  deleteObject(key: string): Promise<void>
  getUrl(key: string): Promise<string | undefined>
}
