# API Usage Examples

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.example.com/api
```

## Authentication

Most endpoints require authentication via JWT tokens.

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response** (201 Created):

```json
{
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "emailVerified": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200 OK):

```json
{
  "user": {
    "id": "clx1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Using Access Token

Include the access token in the Authorization header:

```http
GET /api/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Users API

### Create User

```http
POST /api/users
Content-Type: application/json
Authorization: Bearer {token}

{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user"
}
```

**Response** (201 Created):

```json
{
  "id": "clx9876543210",
  "email": "newuser@example.com",
  "name": "New User",
  "role": "user",
  "emailVerified": false,
  "banned": false,
  "createdAt": "2026-02-13T15:30:00.000Z",
  "updatedAt": "2026-02-13T15:30:00.000Z"
}
```

### Get User by ID

```http
GET /api/users/{id}
Authorization: Bearer {token}
```

**Response** (200 OK):

```json
{
  "id": "clx9876543210",
  "email": "user@example.com",
  "name": "User Name",
  "role": "user",
  "emailVerified": true,
  "image": "https://example.com/avatar.jpg",
  "banned": false,
  "createdAt": "2026-02-13T15:30:00.000Z",
  "updatedAt": "2026-02-13T15:30:00.000Z"
}
```

### Get User by Email

```http
GET /api/users/email/{email}
Authorization: Bearer {token}
```

### List Users

```http
GET /api/users?limit=10&offset=0
Authorization: Bearer {token}
```

**Query Parameters**:

- `limit` (optional): Number of users to return (default: 10)
- `offset` (optional): Number of users to skip (default: 0)

**Response** (200 OK):

```json
[
  {
    "id": "clx1234567890",
    "email": "user1@example.com",
    "name": "User One",
    "role": "user"
  },
  {
    "id": "clx9876543210",
    "email": "user2@example.com",
    "name": "User Two",
    "role": "admin"
  }
]
```

### Update User

```http
PUT /api/users/{id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Updated Name",
  "image": "https://example.com/new-avatar.jpg"
}
```

**Response** (200 OK):

```json
{
  "id": "clx9876543210",
  "email": "user@example.com",
  "name": "Updated Name",
  "image": "https://example.com/new-avatar.jpg",
  "updatedAt": "2026-02-13T16:00:00.000Z"
}
```

### Delete User

```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

**Response** (204 No Content)

## Error Responses

All errors follow RFC 7807 Problem Details format:

### 400 Bad Request

```json
{
  "type": "https://api.example.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Request validation failed",
  "instance": "/api/users",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "type": "https://api.example.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or expired token"
}
```

### 404 Not Found

```json
{
  "type": "https://api.example.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User with identifier 'invalid-id' not found",
  "code": "NOT_FOUND"
}
```

### 409 Conflict

```json
{
  "type": "https://api.example.com/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "User with email 'user@example.com' already exists",
  "code": "USER_ALREADY_EXISTS",
  "metadata": {
    "email": "user@example.com"
  }
}
```

### 422 Unprocessable Entity

```json
{
  "type": "https://api.example.com/errors/business-rule-violation",
  "title": "Business Rule Violation",
  "status": 422,
  "detail": "User is banned: Violation of terms",
  "code": "USER_BANNED",
  "metadata": {
    "userId": "clx1234567890",
    "reason": "Violation of terms"
  }
}
```

## Rate Limiting

API requests are rate-limited:

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

**429 Too Many Requests**:

```json
{
  "type": "https://api.example.com/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Try again later.",
  "retryAfter": 900
}
```

## Pagination

List endpoints support pagination:

```http
GET /api/users?limit=20&offset=40
```

**Response Headers**:

- `X-Total-Count`: Total number of items
- `Link`: Links to first, prev, next, last pages

## Versioning

API supports versioning via URL path:

```http
GET /api/v1/users
GET /api/v2/users
```

Current version: `v1` (default)

## CORS

CORS is enabled for:

- Development: `http://localhost:*`
- Production: Configured domains only

## Swagger Documentation

Interactive API documentation available at:

```
http://localhost:3000/api/docs
```

## Code Examples

### JavaScript/TypeScript

```typescript
const response = await fetch("http://localhost:3000/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    email: "newuser@example.com",
    name: "New User",
  }),
});

const user = await response.json();
```

### cURL

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"email":"newuser@example.com","name":"New User"}'

# Get user
curl http://localhost:3000/api/users/clx1234567890 \
  -H "Authorization: Bearer ${TOKEN}"
```

## Next Steps

- [Error Codes Reference](./error-codes.md)
- [Development Setup](./development-setup.md)
