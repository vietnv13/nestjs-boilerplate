export type SseHandler = (event: MessageEvent) => void

export interface SseClientOptions {
  onOpen?: () => void
  onError?: (event: Event) => void
}

/**
 * Lightweight EventSource wrapper with named-event handlers.
 *
 * Note: `EventSource` automatically reconnects. Call the returned cleanup to stop it.
 */
export function subscribeToSse(
  url: string,
  handlers: Record<string, SseHandler>,
  options: SseClientOptions = {},
) {
  const eventSource = new EventSource(url)

  const listenerEntries = Object.entries(handlers).map(([eventName, handler]) => {
    const listener: EventListener = (event) => handler(event as MessageEvent)
    eventSource.addEventListener(eventName, listener)
    return [eventName, listener] as const
  })

  eventSource.onopen = () => options.onOpen?.()
  eventSource.onerror = (event) => options.onError?.(event)

  return () => {
    for (const [eventName, listener] of listenerEntries) {
      eventSource.removeEventListener(eventName, listener)
    }
    eventSource.close()
  }
}
