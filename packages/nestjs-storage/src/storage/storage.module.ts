import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { LocalStorageDriver } from './drivers/local-storage.driver.js'
import { S3StorageDriver } from './drivers/s3-storage.driver.js'
import { STORAGE_DRIVER, StorageService } from './storage.service.js'

import type { StorageDriver } from './storage.types.js'

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageDriver => {
        const driver = (config.get<string>('STORAGE_DRIVER') ?? 'local').toLowerCase()

        if (driver === 's3') {
          return new S3StorageDriver({
            bucket: config.getOrThrow<string>('STORAGE_S3_BUCKET'),
            region: config.getOrThrow<string>('STORAGE_S3_REGION'),
            endpoint: config.get<string>('STORAGE_S3_ENDPOINT'),
            accessKeyId: config.getOrThrow<string>('STORAGE_S3_ACCESS_KEY_ID'),
            secretAccessKey: config.getOrThrow<string>('STORAGE_S3_SECRET_ACCESS_KEY'),
            forcePathStyle: config.get<boolean>('STORAGE_S3_FORCE_PATH_STYLE'),
            publicBaseUrl: config.get<string>('STORAGE_S3_PUBLIC_BASE_URL'),
            signedUrlExpiresSec: config.getOrThrow<number>('STORAGE_S3_SIGNED_URL_EXPIRES_SEC'),
          })
        }

        return new LocalStorageDriver(
          config.getOrThrow<string>('STORAGE_LOCAL_DIR'),
          config.get<string>('STORAGE_PUBLIC_BASE_URL'),
        )
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
