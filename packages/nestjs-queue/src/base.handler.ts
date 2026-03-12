import type { QueueRegistry } from './queue.registry.js'
import type { HandlerResult } from './queue.types.js'
import type { OnModuleInit } from '@nestjs/common'

/**
 * BaseQueueHandler
 *
 * Abstract base class for all queue job handlers.
 * Extend this class, declare `jobName`, and implement `handle()`.
 * Inject `QueueRegistry` as the **last** constructor argument —
 * the base class registers this instance automatically via `onModuleInit`.
 *
 * The `QueueModule` must be imported (it is global), so `QueueRegistry`
 * is available for injection in any module.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class SendWelcomeEmailHandler extends BaseQueueHandler<{ userId: string }> {
 *   readonly jobName = 'send-welcome-email'
 *
 *   constructor(
 *     private readonly mailer: MailerService,
 *     registry: QueueRegistry,
 *   ) {
 *     super(registry)
 *   }
 *
 *   async handle(payload: { userId: string }): Promise<HandlerResult> {
 *     await this.mailer.sendWelcome(payload.userId)
 *     return { sent: true }
 *   }
 * }
 * ```
 *
 * Add `SendWelcomeEmailHandler` to the `providers` array of the feature module
 * that owns it — nothing else required.
 */
export abstract class BaseQueueHandler<TPayload = Record<string, unknown>> implements OnModuleInit {
  abstract readonly jobName: string

  constructor(private readonly registry: QueueRegistry) {}

  onModuleInit(): void {
    this.registry.register(this)
  }

  abstract handle(payload: TPayload): Promise<HandlerResult>
}
