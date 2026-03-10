import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ enum: ['user', 'admin'], example: 'user' })
  @IsEnum(['user', 'admin'])
  @IsOptional()
  role?: 'user' | 'admin'
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  image?: string
}

export class UserResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  email: string

  @ApiProperty({ nullable: true })
  name: string | null

  @ApiProperty({ enum: ['user', 'admin'] })
  role: 'user' | 'admin'

  @ApiProperty()
  emailVerified: boolean

  @ApiProperty({ nullable: true })
  image: string | null

  @ApiProperty()
  banned: boolean

  @ApiProperty({ nullable: true })
  banReason: string | null

  @ApiProperty({ nullable: true })
  banExpires: Date | null

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
