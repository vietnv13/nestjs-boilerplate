import { Module } from '@nestjs/common'

import { UserRepository } from '@/modules/user/infrastructure/repositories/user.repository'
import { UserController } from '@/modules/user/presentation/controllers/user.controller'
import { UsersService } from '@/modules/user/users.service'

@Module({
  controllers: [UserController],
  providers: [UserRepository, UsersService],
  exports: [UserRepository, UsersService],
})
export class UserModule {}
