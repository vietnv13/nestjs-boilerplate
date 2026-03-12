import { HttpStatus } from '@nestjs/common'

export const ERROR_REGISTRY = {
  // ==========================================================
  // Asset
  // ==========================================================
  ASSET_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Asset not found',
  },
  ASSET_UPLOAD_AUTH_REQUIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Authenticated upload is required for non-public assets',
  },
  ASSET_PUBLIC_CANNOT_HAVE_CREATOR: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Public assets cannot have a creator',
  },
  ASSET_DELETE_CREATOR_ONLY: {
    status: HttpStatus.FORBIDDEN,
    message: 'Only creator-owned assets can be deleted via API',
  },
  ASSET_DELETE_FORBIDDEN: {
    status: HttpStatus.FORBIDDEN,
    message: 'You do not have permission to delete this asset',
  },

  // ==========================================================
  // Todo
  // ==========================================================
  TODO_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Todo not found',
  },
  TODO_TITLE_REQUIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'title is required',
  },

  // ==========================================================
  // User
  // ==========================================================
  USER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'User not found',
  },
  USER_EMAIL_REQUIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'email is required',
  },
  USER_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: 'User already exists',
  },

  // ==========================================================
  // Admin
  // ==========================================================
  ADMIN_ACCESS_REQUIRED: {
    status: HttpStatus.FORBIDDEN,
    message: 'Admin access required',
  },

  // ==========================================================
  // Auth
  // ==========================================================
  AUTH_INVALID_EMAIL_OR_PASSWORD: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Invalid email or password',
  },
  AUTH_EMAIL_ALREADY_REGISTERED: {
    status: HttpStatus.CONFLICT,
    message: 'Email already registered',
  },
  AUTH_INVALID_REFRESH_TOKEN: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Invalid refresh token',
  },
  AUTH_SESSION_NOT_FOUND_OR_EXPIRED: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Session not found or expired',
  },
  AUTH_EMAIL_AUTHENTICATION_NOT_FOUND: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Email authentication not found',
  },
  AUTH_INVALID_CURRENT_PASSWORD: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Invalid current password',
  },

  // ==========================================================
  // API Asset controller
  // ==========================================================
  API_ASSET_FILE_REQUIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'file is required',
  },
} as const

export type ErrorCodeValue = keyof typeof ERROR_REGISTRY

export type ErrorDefinition = (typeof ERROR_REGISTRY)[ErrorCodeValue]

export const ErrorCode = {
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  ASSET_UPLOAD_AUTH_REQUIRED: 'ASSET_UPLOAD_AUTH_REQUIRED',
  ASSET_PUBLIC_CANNOT_HAVE_CREATOR: 'ASSET_PUBLIC_CANNOT_HAVE_CREATOR',
  ASSET_DELETE_CREATOR_ONLY: 'ASSET_DELETE_CREATOR_ONLY',
  ASSET_DELETE_FORBIDDEN: 'ASSET_DELETE_FORBIDDEN',
  TODO_NOT_FOUND: 'TODO_NOT_FOUND',
  TODO_TITLE_REQUIRED: 'TODO_TITLE_REQUIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EMAIL_REQUIRED: 'USER_EMAIL_REQUIRED',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  ADMIN_ACCESS_REQUIRED: 'ADMIN_ACCESS_REQUIRED',
  AUTH_INVALID_EMAIL_OR_PASSWORD: 'AUTH_INVALID_EMAIL_OR_PASSWORD',
  AUTH_EMAIL_ALREADY_REGISTERED: 'AUTH_EMAIL_ALREADY_REGISTERED',
  AUTH_INVALID_REFRESH_TOKEN: 'AUTH_INVALID_REFRESH_TOKEN',
  AUTH_SESSION_NOT_FOUND_OR_EXPIRED: 'AUTH_SESSION_NOT_FOUND_OR_EXPIRED',
  AUTH_EMAIL_AUTHENTICATION_NOT_FOUND: 'AUTH_EMAIL_AUTHENTICATION_NOT_FOUND',
  AUTH_INVALID_CURRENT_PASSWORD: 'AUTH_INVALID_CURRENT_PASSWORD',
  API_ASSET_FILE_REQUIRED: 'API_ASSET_FILE_REQUIRED',
} as const satisfies { [K in ErrorCodeValue]: K }
