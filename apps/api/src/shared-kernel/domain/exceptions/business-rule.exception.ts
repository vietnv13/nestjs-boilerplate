import { DomainException } from "./domain.exception";

export class BusinessRuleException extends DomainException {
  constructor(
    message: string,
    code: string = "BUSINESS_RULE_VIOLATION",
    metadata?: Record<string, unknown>,
  ) {
    super(message, code, 422, metadata);
  }
}

export class UserAlreadyExistsException extends BusinessRuleException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, "USER_ALREADY_EXISTS", { email });
  }
}

export class UserBannedException extends BusinessRuleException {
  constructor(userId: string, reason?: string) {
    super(`User is banned${reason ? `: ${reason}` : ""}`, "USER_BANNED", { userId, reason });
  }
}
