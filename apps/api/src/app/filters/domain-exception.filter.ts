import { Catch, Logger } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'

import { DomainException } from '@/shared-kernel/domain/exceptions/domain.exception'

import type { ProblemDetailsDto } from '@/shared-kernel/infrastructure/dtos/problem-details.dto'
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { Response, Request } from 'express'

/**
 * Domain Exception Filter
 *
 * Catches domain exceptions and converts them to RFC 9457 Problem Details format
 * This provides consistent error responses for business logic violations
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name)

  constructor(private readonly cls: ClsService) {}

  catch(exception: DomainException, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()
    const status = exception.statusCode

    // Streaming responses (e.g., SSE) send headers immediately; don't attempt to write a JSON body.
    if (response.headersSent) {
      response.end()
      return
    }

    const problemDetails: ProblemDetailsDto = {
      type: this.getTypeUri(exception.code),
      title: this.getTitle(status),
      status,
      detail: exception.message,
      instance: request.url,
      request_id: this.cls.getId(),
      correlation_id: this.cls.get('correlationId'),
      trace_id: this.cls.get('traceId'),
      timestamp: new Date().toISOString(),
      // Add domain-specific error code
      code: exception.code,
    }

    // Add metadata if present
    if (exception.metadata && Object.keys(exception.metadata).length > 0) {
      problemDetails.metadata = exception.metadata
    }

    // Log the error
    const logMessage = `${request.method} ${request.url} ${status} [${exception.code}]`
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack)
    } else {
      this.logger.warn(logMessage, { metadata: exception.metadata })
    }

    response.setHeader('Content-Type', 'application/problem+json')
    response.setHeader('Cache-Control', 'no-store')

    response.status(status).json(problemDetails)
  }

  /**
   * Generate problem type URI
   */
  private getTypeUri(code: string): string {
    const baseUrl = process.env.API_BASE_URL ?? 'https://api.example.com'
    const errorType = code.toLowerCase().replaceAll('_', '-')
    return `${baseUrl}/errors/${errorType}`
  }

  /**
   * Get error title based on status code
   */
  private getTitle(status: number): string {
    const titleMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Business Rule Violation',
      500: 'Internal Server Error',
    }

    return titleMap[status] ?? 'Error'
  }
}
