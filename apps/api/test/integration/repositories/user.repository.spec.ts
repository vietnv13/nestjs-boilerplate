import { randomUUID } from 'node:crypto'

import { describe, it, expect, beforeEach } from 'vitest'

import { UserRepository } from '@/modules/user/infrastructure/repositories/user.repository'

import { UserFixtures } from '../../fixtures/user.fixtures'
import { testDb } from '../setup/test-database'
import { TestModuleBuilder } from '../setup/test-module'

describe('userRepository Integration Tests', () => {
  let userRepository: UserRepository
  let fixtures: UserFixtures

  beforeEach(async () => {
    const module = await TestModuleBuilder.createTestingModule([], [UserRepository])

    userRepository = module.get<UserRepository>(UserRepository)
    fixtures = new UserFixtures(testDb.db!)
  })

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        id: randomUUID(),
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user' as const,
      }

      const user = await userRepository.create(userData)

      expect(user).toBeDefined()
      expect(user.email).toBe(userData.email)
      expect(user.name).toBe(userData.name)
      expect(user.role).toBe(userData.role)
      expect(user.id).toBeDefined()
    })
  })

  describe('findById', () => {
    it('should find user by id', async () => {
      const createdUser = await fixtures.createUser({
        email: 'findme@example.com',
        name: 'Find Me',
      })

      const foundUser = await userRepository.findById(createdUser.id)

      expect(foundUser).toBeDefined()
      expect(foundUser?.id).toBe(createdUser.id)
      expect(foundUser?.email).toBe(createdUser.email)
    })

    it('should return null for non-existent user', async () => {
      const user = await userRepository.findById('non-existent-id')
      expect(user).toBeNull()
    })
  })

  describe('setBanned', () => {
    it('should ban a user', async () => {
      const user = await fixtures.createUser()

      const updated = await userRepository.update(user.id, {
        banned: true,
        banReason: 'Violation of terms',
      })

      expect(updated).toBeDefined()
      expect(updated?.banned).toBe(true)
      expect(updated?.banReason).toBe('Violation of terms')

      const bannedUser = await userRepository.findById(user.id)
      expect(bannedUser?.banned).toBe(true)
      expect(bannedUser?.banReason).toBe('Violation of terms')
    })

    it('should unban a user', async () => {
      const user = await fixtures.createUser()
      await userRepository.update(user.id, { banned: true, banReason: 'Test ban' })

      const updated = await userRepository.update(user.id, { banned: false, banReason: null })
      expect(updated).toBeDefined()
      expect(updated?.banned).toBe(false)

      const unbannedUser = await userRepository.findById(user.id)
      expect(unbannedUser?.banned).toBe(false)
      expect(unbannedUser?.banReason).toBeNull()
    })
  })
})
