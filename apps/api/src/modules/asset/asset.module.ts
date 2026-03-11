import { Global, Module } from '@nestjs/common'

import { AssetService } from '@/modules/asset/asset.service'
import { AssetController } from '@/modules/asset/controllers/asset.controller'
import { CleanupAssetsJob } from '@/modules/asset/jobs/cleanup-assets.job'
import { AssetRepository } from '@/modules/asset/repositories/asset.repository'

@Global()
@Module({
  controllers: [AssetController],
  providers: [AssetService, CleanupAssetsJob, AssetRepository],
  exports: [AssetService],
})
export class AssetModule {}
