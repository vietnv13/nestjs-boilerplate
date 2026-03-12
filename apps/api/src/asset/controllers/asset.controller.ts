import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { memoryStorage } from 'multer'

import { AssetService } from '@/asset/asset.service'
import { AssetUploadResponseDto } from '@/asset/dtos/asset-upload-response.dto'
import { UploadAssetDto } from '@/asset/dtos/upload-asset.dto'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '@/auth/guards/optional-jwt-auth.guard'

@ApiTags('assets')
@Controller('assets')
export class AssetController {
  constructor(private readonly assets: AssetService) {}

  @Post('upload')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload file as public or creator-owned asset',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        isPublic: { type: 'boolean' },
        ownerType: { type: 'string' },
        ownerId: { type: 'string' },
        slot: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an asset' })
  @ApiResponse({ status: 201, type: AssetUploadResponseDto })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadAssetDto,
    @Request()
    req: Express.Request & {
      user?: { id: string; email: string; roles: string[]; sessionId: string }
    },
  ): Promise<AssetUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('file is required')
    }

    const isPublic = dto.isPublic ?? true
    const creatorId = isPublic ? undefined : req.user?.id

    const { asset, url } = await this.assets.createAsset({
      buffer: file.buffer,
      filename: file.originalname,
      contentType: file.mimetype,
      isPublic,
      creatorId,
    })

    if (dto.ownerType && dto.ownerId) {
      await this.assets.linkAsset(asset.id, {
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
        slot: dto.slot,
      })
    }

    return {
      id: asset.id,
      key: asset.key,
      url,
      isPublic: asset.isPublic,
      creatorId: asset.creatorId,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a creator-owned asset' })
  async delete(
    @Param('id') id: string,
    @Request() req: Express.Request & { user: { id: string } },
  ): Promise<void> {
    await this.assets.softDeleteAsset(id, req.user.id)
  }
}
