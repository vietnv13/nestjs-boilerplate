import type {
  User,
  CreateUserData,
  UpdateUserData,
} from '@/modules/user/domain/entities/user.entity'

export interface UserRepository {
  create(data: CreateUserData): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(id: string, data: UpdateUserData): Promise<User | null>
  delete(id: string): Promise<boolean>
  findAll(limit?: number, offset?: number): Promise<User[]>
  existsByEmail(email: string): Promise<boolean>
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')
