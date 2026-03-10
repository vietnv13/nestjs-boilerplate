import { DomainException } from "./domain.exception";

export class ConflictException extends DomainException {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, "CONFLICT", 409, metadata);
  }
}
