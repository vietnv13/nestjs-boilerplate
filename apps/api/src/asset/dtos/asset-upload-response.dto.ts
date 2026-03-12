import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AssetUploadResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  key: string

  @ApiPropertyOptional()
  url?: string

  @ApiProperty()
  isPublic: boolean

  @ApiPropertyOptional()
  creatorId?: string | null
}
