import { QueryHandler, type IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetAllUsersQuery } from "./get-all-users.query";
import { USER_REPOSITORY, type UserRepository } from "../ports/user.repository.port";
import type { User } from "../../domain/user.entity";

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery, User[]> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: GetAllUsersQuery): Promise<User[]> {
    return this.userRepository.findAll(query.limit, query.offset);
  }
}
