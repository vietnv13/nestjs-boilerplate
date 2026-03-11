import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { LocalStorageDriver } from './drivers/local-storage.driver'
import { S3StorageDriver } from './drivers/s3-storage.driver'
import { STORAGE_DRIVER, StorageService } from './storage.service'

import type { StorageDriver } from './storage.types'
import type { Env } from '@/app/config/env.schema'

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): StorageDriver => {
        const driver = config.get('STORAGE_DRIVER', { infer: true })

        if (driver === 's3') {
          return new S3StorageDriver({
            bucket: config.get('STORAGE_S3_BUCKET', { infer: true }),
            region: config.get('STORAGE_S3_REGION', { infer: true }),
            endpoint: config.get('STORAGE_S3_ENDPOINT', { infer: true }),
            accessKeyId: config.get('STORAGE_S3_ACCESS_KEY_ID', { infer: true }),
            secretAccessKey: config.get('STORAGE_S3_SECRET_ACCESS_KEY', { infer: true }),
            forcePathStyle: config.get('STORAGE_S3_FORCE_PATH_STYLE', { infer: true }),
            publicBaseUrl: config.get('STORAGE_S3_PUBLIC_BASE_URL', { infer: true }),
            signedUrlExpiresSec: config.get('STORAGE_S3_SIGNED_URL_EXPIRES_SEC', { infer: true }),
          })
        }

        return new LocalStorageDriver(
          config.get('STORAGE_LOCAL_DIR', { infer: true }),
          config.get('STORAGE_PUBLIC_BASE_URL', { infer: true }),
        )
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
