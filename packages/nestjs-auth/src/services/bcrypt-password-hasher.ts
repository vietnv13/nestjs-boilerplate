import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 12

/**
 * Bcrypt password hasher
 */
@Injectable()
export class BcryptPasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_ROUNDS)
  }

  async verify(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash)
  }
}
