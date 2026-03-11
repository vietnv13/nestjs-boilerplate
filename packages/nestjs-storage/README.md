# @workspace/nestjs-storage

Storage abstraction for uploading buffers and generating URLs.

Supports:

- `local` driver (serves files from a local directory)
- `s3` driver (S3-compatible APIs)

## Usage

```ts
import { Module } from '@nestjs/common'
import { StorageModule } from '@workspace/nestjs-storage'

@Module({
  imports: [StorageModule],
})
export class AppModule {}
```

Inject `StorageService`:

```ts
import { Injectable } from '@nestjs/common'
import { StorageService } from '@workspace/nestjs-storage'

@Injectable()
export class AssetsService {
  constructor(private readonly storage: StorageService) {}
}
```

## Environment variables

Local:

- `STORAGE_DRIVER=local` (default)
- `STORAGE_LOCAL_DIR` (required)
- `STORAGE_PUBLIC_BASE_URL` (optional)

S3:

- `STORAGE_DRIVER=s3`
- `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`
- `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY`
- `STORAGE_S3_SIGNED_URL_EXPIRES_SEC`
- `STORAGE_S3_ENDPOINT`, `STORAGE_S3_FORCE_PATH_STYLE`, `STORAGE_S3_PUBLIC_BASE_URL` (optional)
