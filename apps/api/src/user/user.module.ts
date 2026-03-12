import { Module } from '@nestjs/common'

import { UserController } from '@/user/controllers/user.controller'
import { UserRepository } from '@/user/repositories/user.repository'
import { UsersService } from '@/user/users.service'

@Module({
  controllers: [UserController],
  providers: [UserRepository, UsersService],
  exports: [UserRepository, UsersService],
})
export class UserModule {}
