import { Injectable, Logger } from '@nestjs/common'

import type { BaseQueueHandler } from './base.handler.js'

/**
 * QueueRegistry
 *
 * Central in-process map of handler name → handler instance.
 * Handlers self-register via BaseQueueHandler.onModuleInit().
 */
@Injectable()
export class QueueRegistry {
  private readonly logger = new Logger(QueueRegistry.name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<string, BaseQueueHandler<any>>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(handler: BaseQueueHandler<any>): void {
    if (this.handlers.has(handler.jobName)) {
      this.logger.warn(`Duplicate handler registered for job "${handler.jobName}" — overwriting`)
    }
    this.handlers.set(handler.jobName, handler)
    this.logger.log(`Handler registered: "${handler.jobName}"`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(name: string): BaseQueueHandler<any> | undefined {
    return this.handlers.get(name)
  }

  has(name: string): boolean {
    return this.handlers.has(name)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAll(): Map<string, BaseQueueHandler<any>> {
    return this.handlers
  }
}
