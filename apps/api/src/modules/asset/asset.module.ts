import { Global, Module } from '@nestjs/common'

import { CleanupAssetsJob } from '@/modules/asset/application/jobs/cleanup-assets.job'
import { ASSET_REPOSITORY } from '@/modules/asset/application/ports/asset.repository.port'
import { AssetService } from '@/modules/asset/application/services/asset.service'
import { AssetRepositoryImpl } from '@/modules/asset/infrastructure/repositories/asset.repository'
import { AssetController } from '@/modules/asset/presentation/controllers/asset.controller'

@Global()
@Module({
  controllers: [AssetController],
  providers: [
    AssetService,
    CleanupAssetsJob,
    {
      provide: ASSET_REPOSITORY,
      useClass: AssetRepositoryImpl,
    },
  ],
  exports: [AssetService],
})
export class AssetModule {}
