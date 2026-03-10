import { DomainException } from "./domain.exception";

export class ValidationException extends DomainException {
  constructor(message: string, field?: string, metadata?: Record<string, any>) {
    super(message, "VALIDATION_ERROR", 400, field ? { field, ...metadata } : metadata);
  }
}
