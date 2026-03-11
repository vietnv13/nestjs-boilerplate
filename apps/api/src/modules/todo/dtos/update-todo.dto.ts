import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'

/**
 * Update Todo DTO
 *
 * Validates request body for updating a todo
 * All fields are optional, only provided fields will be updated
 */
export class UpdateTodoDto {
  /**
   * Todo title
   */
  @ApiPropertyOptional({
    description: 'Todo title',
    example: 'Complete project documentation',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string

  /**
   * Todo description
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
   * Completed status
   */
  @ApiPropertyOptional({
    description: 'Completion status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean
}
