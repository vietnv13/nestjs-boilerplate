import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import { ERROR_REGISTRY } from './error-registry.js'

import type { ErrorCodeValue } from './error-registry.js'

export type ErrorMetadata = Record<string, unknown>

export interface CreateHttpExceptionOptions {
  message?: string
  metadata?: ErrorMetadata
}

export function createHttpException(
  code: ErrorCodeValue,
  options?: CreateHttpExceptionOptions,
): HttpException {
  const definition = ERROR_REGISTRY[code]
  const status = definition.status as HttpStatus
  const message = options?.message ?? definition.message

  const response: Record<string, unknown> = {
    statusCode: status,
    message,
    code,
  }

  if (options?.metadata) {
    response.metadata = options.metadata
  }

  switch (status) {
    case HttpStatus.BAD_REQUEST: {
      return new BadRequestException(response)
    }
    case HttpStatus.UNAUTHORIZED: {
      return new UnauthorizedException(response)
    }
    case HttpStatus.FORBIDDEN: {
      return new ForbiddenException(response)
    }
    case HttpStatus.NOT_FOUND: {
      return new NotFoundException(response)
    }
    case HttpStatus.CONFLICT: {
      return new ConflictException(response)
    }
    case HttpStatus.UNPROCESSABLE_ENTITY: {
      return new UnprocessableEntityException(response)
    }
    default: {
      return new HttpException(response, status)
    }
  }
}
