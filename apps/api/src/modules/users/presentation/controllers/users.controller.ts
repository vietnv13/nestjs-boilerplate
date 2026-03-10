import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { CreateUserCommand } from '@/modules/users/application/commands/create-user.command'
import { DeleteUserCommand } from '@/modules/users/application/commands/delete-user.command'
import { UpdateUserCommand } from '@/modules/users/application/commands/update-user.command'
import { GetAllUsersQuery } from '@/modules/users/application/queries/get-all-users.query'
import { GetUserByEmailQuery } from '@/modules/users/application/queries/get-user-by-email.query'
import { GetUserByIdQuery } from '@/modules/users/application/queries/get-user-by-id.query'
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '@/modules/users/presentation/dtos/user.dto'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const command = new CreateUserCommand(dto.email, dto.name, dto.role)
    return this.commandBus.execute(command)
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  async getAllUsers(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ): Promise<UserResponseDto[]> {
    const query = new GetAllUsersQuery(Number(limit), Number(offset))
    return this.queryBus.execute(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const query = new GetUserByIdQuery(id)
    return this.queryBus.execute(query)
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByEmail(@Param('email') email: string): Promise<UserResponseDto> {
    const query = new GetUserByEmailQuery(email)
    return this.queryBus.execute(query)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    const command = new UpdateUserCommand(id, dto)
    return this.commandBus.execute(command)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string): Promise<void> {
    const command = new DeleteUserCommand(id)
    await this.commandBus.execute(command)
  }
}
