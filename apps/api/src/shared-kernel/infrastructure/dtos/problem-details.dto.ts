import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class FieldError {
  @ApiProperty()
  field: string

  @ApiProperty()
  pointer: string

  @ApiProperty()
  code: string

  @ApiProperty()
  message: string
}

export class ProblemDetailsDto {
  @ApiProperty()
  type: string

  @ApiProperty()
  title: string

  @ApiProperty()
  status: number

  @ApiProperty()
  detail: string

  @ApiProperty()
  instance: string

  @ApiPropertyOptional()
  request_id?: string

  @ApiPropertyOptional()
  correlation_id?: string

  @ApiPropertyOptional()
  trace_id?: string

  @ApiPropertyOptional()
  timestamp?: string

  @ApiPropertyOptional()
  code?: string

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>

  @ApiPropertyOptional({ type: [FieldError] })
  errors?: FieldError[]
}
