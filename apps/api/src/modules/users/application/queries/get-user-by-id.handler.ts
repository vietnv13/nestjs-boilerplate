import { QueryHandler, type IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetUserByIdQuery } from "./get-user-by-id.query";
import { USER_REPOSITORY, type UserRepository } from "../ports/user.repository.port";
import { UserNotFoundException } from "@/shared-kernel/domain/exceptions";
import type { User } from "../../domain/user.entity";

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, User> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    const user = await this.userRepository.findById(query.id);

    if (!user) {
      throw new UserNotFoundException(query.id);
    }

    return user;
  }
}
