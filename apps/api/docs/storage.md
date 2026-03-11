# Storage (Local / S3)

This API includes a simple storage abstraction for file uploads with two drivers:

- `local` (filesystem)
- `s3` (AWS S3 or S3-compatible services like MinIO)

The storage service is global and can be injected anywhere in the API.

---

## Configuration

Set the driver in `apps/api/.env`:

```dotenv
STORAGE_DRIVER=local
```

### Local driver

```dotenv
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=uploads
# Optional: build absolute URLs instead of returning `/uploads/...`
# STORAGE_PUBLIC_BASE_URL=https://api.example.com
```

When `local` is enabled, the API serves files at:

- `GET /uploads/<key>`

### S3 driver

```dotenv
STORAGE_DRIVER=s3
STORAGE_S3_BUCKET=your-bucket
STORAGE_S3_REGION=ap-southeast-1
STORAGE_S3_ACCESS_KEY_ID=...
STORAGE_S3_SECRET_ACCESS_KEY=...

# Optional (S3-compatible)
# STORAGE_S3_ENDPOINT=https://minio.example.com
# STORAGE_S3_FORCE_PATH_STYLE=true

# Optional (public bucket / CDN). If not set, the API returns signed GET URLs.
# STORAGE_S3_PUBLIC_BASE_URL=https://cdn.example.com/your-bucket
STORAGE_S3_SIGNED_URL_EXPIRES_SEC=900
```

---

## Usage

Inject `StorageService` and call `uploadBuffer()`.

Example (controller with multipart upload):

```ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { StorageService } from '@/shared-kernel/infrastructure/storage/storage.service'

@Controller('v1/files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const { key, url } = await this.storage.uploadBuffer({
      buffer: file.buffer,
      contentType: file.mimetype,
      filename: file.originalname,
      prefix: 'files',
    })

    return { key, url }
  }
}
```

Notes:

- This assumes `FileInterceptor` is configured to use memory storage (default in Nest).
- `key` is the durable identifier to store in your DB.
- `url` is either `/uploads/<key>` (local), a public S3 URL (if configured), or a signed URL (S3).

---

## Asset Module

This repo also includes an `AssetModule` that builds on `StorageService`:

- `POST /assets/upload`: multipart upload (public by default). For private uploads set `isPublic=false` and include a JWT; the asset will be creator-owned.
- `DELETE /assets/:id`: soft delete (creator-owned assets only).

Linking:

- Assets are stored in `assets`.
- Links to other entities are stored in `asset_links` with `(ownerType, ownerId, slot)` to support:
  - user avatar: `ownerType=user`, `slot=avatar` (single-slot)
  - article images: `ownerType=article`, `slot=cover|gallery|...` (multiple per slot)

Cleanup job:

- `asset.cleanup-assets` hard-deletes storage objects and DB rows when:
  - the asset was never linked for 90 days since creation, or
  - the asset was soft deleted for 90 days since deletion.
