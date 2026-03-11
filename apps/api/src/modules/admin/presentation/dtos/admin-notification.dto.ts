import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class AdminNotificationCreateDto {
  @ApiProperty({ example: 'Weekly report ready' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string

  @ApiPropertyOptional({ example: 'Your weekly analytics report is available' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string
}

export class AdminNotificationPublishResponseDto {
  @ApiProperty({ enum: ['redis', 'memory'], example: 'redis' })
  transport!: 'redis' | 'memory'

  @ApiProperty({
    example: 1,
    description:
      'Number of local SSE subscribers delivered (only meaningful when transport is "memory")',
  })
  delivered!: number
}
