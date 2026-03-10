# Error Codes Reference

## Overview

All API errors include a `code` field for programmatic error handling.

## Error Code Format

```
{DOMAIN}_{ERROR_TYPE}
```

Examples: `USER_NOT_FOUND`, `AUTH_INVALID_CREDENTIALS`, `VALIDATION_ERROR`

## Common Error Codes

### Validation Errors (400)

| Code                      | Description                        |
| ------------------------- | ---------------------------------- |
| `VALIDATION_ERROR`        | Request validation failed          |
| `INVALID_EMAIL_FORMAT`    | Email format is invalid            |
| `INVALID_PASSWORD_FORMAT` | Password doesn't meet requirements |

### Authentication Errors (401)

| Code                         | Description                    |
| ---------------------------- | ------------------------------ |
| `AUTH_INVALID_CREDENTIALS`   | Email or password is incorrect |
| `AUTH_TOKEN_EXPIRED`         | Access token has expired       |
| `AUTH_TOKEN_INVALID`         | Token is malformed or invalid  |
| `AUTH_REFRESH_TOKEN_EXPIRED` | Refresh token has expired      |

### Authorization Errors (403)

| Code                            | Description                     |
| ------------------------------- | ------------------------------- |
| `AUTH_INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `AUTH_EMAIL_NOT_VERIFIED`       | Email verification required     |

### Not Found Errors (404)

| Code             | Description                  |
| ---------------- | ---------------------------- |
| `NOT_FOUND`      | Generic resource not found   |
| `USER_NOT_FOUND` | User with given ID not found |
| `TODO_NOT_FOUND` | Todo item not found          |

### Conflict Errors (409)

| Code                  | Description                    |
| --------------------- | ------------------------------ |
| `CONFLICT`            | Generic resource conflict      |
| `USER_ALREADY_EXISTS` | User with email already exists |
| `EMAIL_ALREADY_TAKEN` | Email is already in use        |

### Business Rule Violations (422)

| Code                      | Description                     |
| ------------------------- | ------------------------------- |
| `BUSINESS_RULE_VIOLATION` | Generic business rule violation |
| `USER_BANNED`             | User account is banned          |
| `INSUFFICIENT_BALANCE`    | Account balance too low         |
| `ORDER_ALREADY_SHIPPED`   | Cannot modify shipped order     |

### Rate Limiting (429)

| Code                  | Description       |
| --------------------- | ----------------- |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

### Server Errors (500)

| Code                     | Description                     |
| ------------------------ | ------------------------------- |
| `INTERNAL_SERVER_ERROR`  | Unexpected server error         |
| `DATABASE_ERROR`         | Database operation failed       |
| `EXTERNAL_SERVICE_ERROR` | Third-party service unavailable |

## Error Response Structure

```typescript
interface ProblemDetails {
  type: string; // URL to error documentation
  title: string; // Human-readable error title
  status: number; // HTTP status code
  detail: string; // Detailed error message
  instance?: string; // Request path
  code: string; // Machine-readable error code
  metadata?: object; // Additional error context
  errors?: Array<{
    // Validation errors
    field: string;
    message: string;
  }>;
}
```

## Example Error Responses

### Validation Error

```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/users",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    },
    {
      "field": "password",
      "message": "password must be at least 8 characters"
    }
  ]
}
```

### Business Rule Violation

```json
{
  "type": "https://api.example.com/errors/business-rule-violation",
  "title": "Business Rule Violation",
  "status": 422,
  "detail": "User is banned: Violation of terms of service",
  "instance": "/api/auth/login",
  "code": "USER_BANNED",
  "metadata": {
    "userId": "clx1234567890",
    "reason": "Violation of terms of service",
    "banExpires": "2026-03-13T00:00:00.000Z"
  }
}
```

### Not Found Error

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User with identifier 'invalid-id' not found",
  "instance": "/api/users/invalid-id",
  "code": "USER_NOT_FOUND",
  "metadata": {
    "identifier": "invalid-id"
  }
}
```

## Error Handling Best Practices

### Client-Side

```typescript
async function createUser(data: CreateUserDto) {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();

      // Handle specific error codes
      switch (error.code) {
        case "USER_ALREADY_EXISTS":
          throw new Error("This email is already registered");
        case "VALIDATION_ERROR":
          throw new ValidationError(error.errors);
        case "RATE_LIMIT_EXCEEDED":
          throw new Error("Too many requests. Please try again later.");
        default:
          throw new Error(error.detail);
      }
    }

    return response.json();
  } catch (error) {
    // Handle network errors
    console.error("Failed to create user:", error);
    throw error;
  }
}
```

### Retry Logic

Some errors are retryable:

```typescript
const RETRYABLE_CODES = ["RATE_LIMIT_EXCEEDED", "EXTERNAL_SERVICE_ERROR", "DATABASE_ERROR"];

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json();

        if (RETRYABLE_CODES.includes(error.code) && i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## Custom Error Codes

When adding new error codes:

1. Follow naming convention: `{DOMAIN}_{ERROR_TYPE}`
2. Document in this file
3. Use appropriate HTTP status code
4. Include helpful metadata

Example:

```typescript
export class OrderAlreadyShippedException extends BusinessRuleException {
  constructor(orderId: string) {
    super("Cannot modify order that has already been shipped", "ORDER_ALREADY_SHIPPED", {
      orderId,
    });
  }
}
```

## Next Steps

- [API Usage Examples](./api-usage.md)
- [Development Setup](./development-setup.md)
