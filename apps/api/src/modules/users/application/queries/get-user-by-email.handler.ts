import { Inject } from "@nestjs/common";
import { QueryHandler } from "@nestjs/cqrs";

import { USER_REPOSITORY } from "@/modules/users/application/ports/user.repository.port";
import { UserNotFoundException } from "@/shared-kernel/domain/exceptions";

import { GetUserByEmailQuery } from "./get-user-by-email.query";

import type { UserRepository } from "@/modules/users/application/ports/user.repository.port";
import type { User } from "@/modules/users/domain/user.entity";
import type { IQueryHandler } from "@nestjs/cqrs";

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery, User> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetUserByEmailQuery): Promise<User> {
    const user = await this.userRepository.findByEmail(query.email);

    if (!user) {
      throw new UserNotFoundException(query.email);
    }

    return user;
  }
}
