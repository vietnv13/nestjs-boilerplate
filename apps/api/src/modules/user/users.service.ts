import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'

import { UserRepository } from '@/modules/user/infrastructure/repositories/user.repository'

import type { CreateUserDto, UpdateUserDto, UserResponseDto } from '@/modules/user/presentation/dtos/user.dto'

@Injectable()
export class UsersService {
  constructor(private readonly users: UserRepository) {}

  private toResponseDto(user: any): UserResponseDto {
    return {
      ...user,
      role: user.role === 'admin' ? 'admin' : 'user',
    } as UserResponseDto
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    if (!dto.email?.trim()) {
      throw new BadRequestException('email is required')
    }

    const exists = await this.users.existsByEmail(dto.email)
    if (exists) {
      throw new ConflictException('User already exists')
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
    if (!user) throw new NotFoundException('User not found')
    return this.toResponseDto(user)
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.users.findByEmail(email)
    if (!user) throw new NotFoundException('User not found')
    return this.toResponseDto(user)
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.users.update(id, dto)
    if (!user) throw new NotFoundException('User not found')
    return this.toResponseDto(user)
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.users.delete(id)
    if (!deleted) throw new NotFoundException('User not found')
  }
}
