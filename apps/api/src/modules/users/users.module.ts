import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

import { CreateUserHandler } from "@/modules/users/application/commands/create-user.handler";
import { DeleteUserHandler } from "@/modules/users/application/commands/delete-user.handler";
import { UpdateUserHandler } from "@/modules/users/application/commands/update-user.handler";
import { USER_REPOSITORY } from "@/modules/users/application/ports/user.repository.port";
import { GetAllUsersHandler } from "@/modules/users/application/queries/get-all-users.handler";
import { GetUserByEmailHandler } from "@/modules/users/application/queries/get-user-by-email.handler";
import { GetUserByIdHandler } from "@/modules/users/application/queries/get-user-by-id.handler";
import { UserRegistrationSaga } from "@/modules/users/application/sagas/user-registration.saga";
import { UserRepositoryImpl } from "@/modules/users/infrastructure/repositories/user.repository";
import { UsersController } from "@/modules/users/presentation/controllers/users.controller";

const CommandHandlers = [CreateUserHandler, UpdateUserHandler, DeleteUserHandler];
const QueryHandlers = [GetUserByIdHandler, GetUserByEmailHandler, GetAllUsersHandler];
const Sagas = [UserRegistrationSaga];

@Module({
  imports: [CqrsModule],
  controllers: [UsersController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...Sagas,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [USER_REPOSITORY],
})
export class UsersModule {}
