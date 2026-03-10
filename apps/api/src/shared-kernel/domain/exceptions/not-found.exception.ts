import { DomainException } from "./domain.exception";

export class NotFoundException extends DomainException {
  constructor(resource: string, identifier: string | number, metadata?: Record<string, any>) {
    super(`${resource} with identifier '${identifier}' not found`, "NOT_FOUND", 404, metadata);
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super("User", identifier);
  }
}
