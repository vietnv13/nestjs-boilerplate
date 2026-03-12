import { Injectable } from '@nestjs/common'
import { createHttpException, ErrorCode } from '@workspace/error-code'

import { UserRepository } from '@/user/repositories/user.repository'

import type { CreateUserDto, UpdateUserDto, UserResponseDto } from '@/user/dtos/user.dto'
import type { UserDatabase } from '@workspace/database'

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  private toResponseDto(user: UserDatabase): UserResponseDto {
    return {
      ...user,
      role: user.role === 'admin' ? 'admin' : 'user',
    } as UserResponseDto
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    if (!dto.email?.trim()) {
      throw createHttpException(ErrorCode.USER_EMAIL_REQUIRED)
    }

    const exists = await this.users.existsByEmail(dto.email)
    if (exists) {
      throw createHttpException(ErrorCode.USER_ALREADY_EXISTS)
    }

    const user = await this.users.create({
      email: dto.email.trim().toLowerCase(),
      name: dto.name,
      role: dto.role,
    })

    return this.toResponseDto(user)
  }

  async findAll(limit = 10, offset = 0): Promise<UserResponseDto[]> {
    const users = await this.users.findAll(limit, offset)
    return users.map((user) => this.toResponseDto(user))
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id)
    if (!user) throw createHttpException(ErrorCode.USER_NOT_FOUND)
    return this.toResponseDto(user)
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.users.findByEmail(email)
    if (!user) throw createHttpException(ErrorCode.USER_NOT_FOUND)
    return this.toResponseDto(user)
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.users.update(id, dto)
    if (!user) throw createHttpException(ErrorCode.USER_NOT_FOUND)
    return this.toResponseDto(user)
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.users.delete(id)
    if (!deleted) throw createHttpException(ErrorCode.USER_NOT_FOUND)
  }
}
