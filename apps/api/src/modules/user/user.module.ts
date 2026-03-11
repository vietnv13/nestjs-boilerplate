import { Module } from '@nestjs/common'

import { UserController } from '@/modules/user/controllers/user.controller'
import { UserRepository } from '@/modules/user/repositories/user.repository'
import { UsersService } from '@/modules/user/users.service'

@Module({
  controllers: [UserController],
  providers: [UserRepository, UsersService],
  exports: [UserRepository, UsersService],
})
export class UserModule {}
