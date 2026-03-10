import { Inject } from '@nestjs/common'
import { QueryHandler } from '@nestjs/cqrs'

import { USER_REPOSITORY } from '@/modules/users/application/ports/user.repository.port'
import { UserNotFoundException } from '@/shared-kernel/domain/exceptions'

import { GetUserByIdQuery } from './get-user-by-id.query'

import type { UserRepository } from '@/modules/users/application/ports/user.repository.port'
import type { User } from '@/modules/users/domain/user.entity'
import type { IQueryHandler } from '@nestjs/cqrs'

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, User> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.userRepository.findById(query.id)

    if (!user) {
      throw new UserNotFoundException(query.id)
    }

    return user
  }
}
