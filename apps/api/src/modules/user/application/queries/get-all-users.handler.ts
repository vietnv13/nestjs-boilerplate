import { Inject } from '@nestjs/common'
import { QueryHandler } from '@nestjs/cqrs'

import { USER_REPOSITORY } from '@/modules/user/application/ports/user.repository.port'

import { GetAllUsersQuery } from './get-all-users.query'

import type { UserRepository } from '@/modules/user/application/ports/user.repository.port'
import type { User } from '@/modules/user/domain/entities/user.entity'
import type { IQueryHandler } from '@nestjs/cqrs'

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery, User[]> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetAllUsersQuery): Promise<User[]> {
    return this.userRepository.findAll(query.limit, query.offset)
  }
}
