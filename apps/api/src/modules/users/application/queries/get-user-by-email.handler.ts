import { QueryHandler, type IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetUserByEmailQuery } from "./get-user-by-email.query";
import { USER_REPOSITORY, type UserRepository } from "../ports/user.repository.port";
import { UserNotFoundException } from "@/shared-kernel/domain/exceptions";
import type { User } from "../../domain/user.entity";

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
