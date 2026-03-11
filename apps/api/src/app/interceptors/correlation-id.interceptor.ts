import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { tap } from 'rxjs/operators'

import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import type { Response } from 'express'
import type { Observable } from 'rxjs'

/**
 * Correlation ID interceptor - adds X-Correlation-Id to response headers
 * Used for cross-service business transaction tracking
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp()
    const response = httpContext.getResponse<Response>()

    const correlationId = this.cls.get<string>('correlationId')

    // SSE may flush headers very early; avoid setting headers after streaming starts.
    if (correlationId && !response.headersSent) {
      response.setHeader('X-Correlation-Id', correlationId)
    }

    return next.handle().pipe(
      tap(() => {
        // Post-request handling if needed
      }),
    )
  }
}
