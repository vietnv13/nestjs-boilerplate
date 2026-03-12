import { Global, Module } from '@nestjs/common'

import { AssetService } from '@/asset/asset.service'
import { AssetController } from '@/asset/controllers/asset.controller'
import { CleanupAssetsJob } from '@/asset/jobs/cleanup-assets.job'
import { AssetRepository } from '@/asset/repositories/asset.repository'

@Global()
@Module({
  controllers: [AssetController],
  providers: [AssetService, CleanupAssetsJob, AssetRepository],
  exports: [AssetService],
})
export class AssetModule {}
