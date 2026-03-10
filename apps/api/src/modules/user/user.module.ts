import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { CreateUserHandler } from '@/modules/user/application/commands/create-user.handler'
import { DeleteUserHandler } from '@/modules/user/application/commands/delete-user.handler'
import { UpdateUserHandler } from '@/modules/user/application/commands/update-user.handler'
import { USER_REPOSITORY } from '@/modules/user/application/ports/user.repository.port'
import { GetAllUsersHandler } from '@/modules/user/application/queries/get-all-users.handler'
import { GetUserByEmailHandler } from '@/modules/user/application/queries/get-user-by-email.handler'
import { GetUserByIdHandler } from '@/modules/user/application/queries/get-user-by-id.handler'
import { UserRegistrationSaga } from '@/modules/user/application/sagas/user-registration.saga'
import { UserRepositoryImpl } from '@/modules/user/infrastructure/repositories/user.repository'
import { UserController } from '@/modules/user/presentation/controllers/user.controller'

const CommandHandlers = [CreateUserHandler, UpdateUserHandler, DeleteUserHandler]
const QueryHandlers = [GetUserByIdHandler, GetUserByEmailHandler, GetAllUsersHandler]
const Sagas = [UserRegistrationSaga]

@Module({
  imports: [CqrsModule],
  controllers: [UserController],
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
export class UserModule {}
