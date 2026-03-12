import { Global, Module } from '@nestjs/common'
import { AssetRepository, AssetService } from '@workspace/nestjs-core'

import { AssetController } from '@/asset/controllers/asset.controller'
import { CleanupAssetsJob } from '@/asset/jobs/cleanup-assets.job'

@Global()
@Module({
  controllers: [AssetController],
  providers: [AssetService, AssetRepository, CleanupAssetsJob],
  exports: [AssetService],
})
export class AssetModule {}
