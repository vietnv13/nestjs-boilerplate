import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

/**
 * Create Todo DTO
 *
 * Validates request body for creating a todo
 */
export class CreateTodoDto {
  /**
   * Todo title
   */
  @ApiProperty({
    description: 'Todo title',
    example: 'Complete project documentation',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string

  /**
   * Todo description (optional)
   */
  @ApiPropertyOptional({
    description: 'Todo description',
    example: 'Write API docs and architecture guide',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string

  /**
   * Completed status (optional, defaults to false)
   */
  @ApiPropertyOptional({
    description: 'Completion status',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean
}
