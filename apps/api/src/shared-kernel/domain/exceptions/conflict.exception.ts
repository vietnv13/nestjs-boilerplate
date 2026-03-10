import { DomainException } from './domain.exception'

export class ConflictException extends DomainException {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, metadata)
  }
}
