import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

// Command Handlers
import { CreateUserHandler } from "./application/commands/create-user.handler";
import { UpdateUserHandler } from "./application/commands/update-user.handler";
import { DeleteUserHandler } from "./application/commands/delete-user.handler";

// Query Handlers
import { GetUserByIdHandler } from "./application/queries/get-user-by-id.handler";
import { GetUserByEmailHandler } from "./application/queries/get-user-by-email.handler";
import { GetAllUsersHandler } from "./application/queries/get-all-users.handler";

// Repository
import { UserRepositoryImpl } from "./infrastructure/repositories/user.repository";
import { USER_REPOSITORY } from "./application/ports/user.repository.port";

// Controllers
import { UsersController } from "./presentation/controllers/users.controller";

const CommandHandlers = [CreateUserHandler, UpdateUserHandler, DeleteUserHandler];

const QueryHandlers = [GetUserByIdHandler, GetUserByEmailHandler, GetAllUsersHandler];

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
