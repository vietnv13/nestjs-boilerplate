import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

export class UploadAssetDto {
  @ApiPropertyOptional({
    description: 'Upload as public asset (no creator) or creator-owned private asset',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean

  @ApiPropertyOptional({ description: 'Optional owner type for linking (e.g., user, article)' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ownerType?: string

  @ApiPropertyOptional({
    description: 'Optional owner id for linking (string, e.g., userId/articleId)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  ownerId?: string

  @ApiPropertyOptional({
    description: 'Optional slot/type for linking (e.g., avatar, cover, gallery)',
    default: 'default',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  slot?: string
}
