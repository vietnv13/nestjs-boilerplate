'use client'

/** Handler called when an SSE event fires. */
export type SseHandler = (event: MessageEvent) => void

type StatusListener = (connected: boolean) => void

/**
 * SseClient
 *
 * Generic browser-side Server-Sent Events client with:
 * - Reference-counted connection management (auto-close when unused)
 * - Per-event-name subscriptions
 * - Connection status listeners
 * - Exponential-backoff reconnection (500ms base, 10s max, +jitter)
 *
 * @example
 * ```ts
 * // Connect and subscribe
 * const disconnect = sseClient.connect('/api/sse/stream')
 * const unsubscribe = sseClient.subscribe('notification', (e) => console.log(e.data))
 *
 * // Cleanup
 * unsubscribe()
 * disconnect()
 * ```
 */
export class SseClient {
  private eventSource: EventSource | null = null
  private currentUrl: string | null = null
  private readonly handlersByEvent = new Map<string, Set<SseHandler>>()
  private readonly listenersByEvent = new Map<string, EventListener>()
  private attachedEventNames = new Set<string>()
  private readonly statusListeners = new Set<StatusListener>()
  private connected = false
  private refCount = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0

  /**
   * Open the SSE connection to `url`.
   * Reference-counted — multiple callers can call `connect()` and the
   * connection stays alive until all returned unsubscribe functions are called.
   *
   * @returns Cleanup function. Call it to release this caller's reference.
   */
  connect(url: string): () => void {
    this.refCount += 1
    this.currentUrl = url
    this.ensureConnected()

    return () => {
      this.refCount = Math.max(0, this.refCount - 1)
      if (this.refCount === 0) {
        this.clearReconnectTimer()
        this.eventSource?.close()
        this.eventSource = null
        this.currentUrl = null
        this.attachedEventNames.clear()
        this.setConnected(false)
      }
    }
  }

  /**
   * Subscribe to a named SSE event.
   * @returns Cleanup function. Call it to unsubscribe.
   */
  subscribe(eventName: string, handler: SseHandler): () => void {
    const set = this.handlersByEvent.get(eventName) ?? new Set<SseHandler>()
    set.add(handler)
    this.handlersByEvent.set(eventName, set)
    this.ensureListener(eventName)

    return () => {
      const current = this.handlersByEvent.get(eventName)
      if (!current) return
      current.delete(handler)
      if (current.size === 0) {
        this.handlersByEvent.delete(eventName)
        this.teardownListener(eventName)
      }
    }
  }

  /**
   * Subscribe to connection status changes.
   * The listener is called immediately with the current state.
   * @returns Cleanup function.
   */
  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    listener(this.connected)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  /** Whether the EventSource is currently connected. */
  get isConnected(): boolean {
    return this.connected
  }

  /**
   * Close the current connection and reconnect with backoff.
   * No-op if no callers hold an active reference.
   */
  forceReconnect(): void {
    if (this.refCount === 0) return
    this.clearReconnectTimer()
    this.eventSource?.close()
    this.eventSource = null
    this.attachedEventNames.clear()
    this.setConnected(false)
    this.scheduleReconnect()
  }

  private setConnected(value: boolean) {
    if (this.connected === value) return
    this.connected = value
    for (const listener of this.statusListeners) {
      listener(value)
    }
  }

  private ensureConnected() {
    if (this.eventSource) return
    if (!this.currentUrl) return

    this.clearReconnectTimer()
    this.eventSource = new EventSource(this.currentUrl)
    this.attachedEventNames = new Set()

    this.eventSource.addEventListener('open', () => {
      this.reconnectAttempt = 0
      this.setConnected(true)
    })

    this.eventSource.addEventListener('error', () => {
      this.setConnected(false)
      this.eventSource?.close()
      this.eventSource = null
      this.attachedEventNames.clear()
      this.scheduleReconnect()
    })

    // Re-attach listeners for the new EventSource instance.
    for (const [eventName, listener] of this.listenersByEvent) {
      this.eventSource.addEventListener(eventName, listener)
      this.attachedEventNames.add(eventName)
    }

    // Ensure listeners exist for any pre-registered handlers.
    for (const eventName of this.handlersByEvent.keys()) {
      this.ensureListener(eventName)
    }
  }

  private scheduleReconnect() {
    if (this.refCount === 0) return
    if (this.eventSource) return
    if (!this.currentUrl) return
    if (this.reconnectTimer) return

    const baseDelayMs = 500
    const maxDelayMs = 10_000
    const attempt = Math.min(this.reconnectAttempt, 10)
    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
    const jitter = Math.floor(Math.random() * 250)

    this.reconnectAttempt += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.ensureConnected()
    }, delay + jitter)
  }

  private clearReconnectTimer() {
    if (!this.reconnectTimer) return
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  private ensureListener(eventName: string) {
    let listener = this.listenersByEvent.get(eventName)
    if (!listener) {
      listener = (event) => {
        const handlers = this.handlersByEvent.get(eventName)
        if (!handlers || handlers.size === 0) return
        for (const handler of handlers) {
          handler(event as MessageEvent)
        }
      }
      this.listenersByEvent.set(eventName, listener)
    }

    if (this.eventSource) {
      if (this.attachedEventNames.has(eventName)) return
      this.eventSource.addEventListener(eventName, listener)
      this.attachedEventNames.add(eventName)
    }
  }

  private teardownListener(eventName: string) {
    const listener = this.listenersByEvent.get(eventName)
    if (!listener) return
    this.eventSource?.removeEventListener(eventName, listener)
    this.listenersByEvent.delete(eventName)
    this.attachedEventNames.delete(eventName)
  }
}

/** Shared singleton instance. One per app bundle. */
export const sseClient = new SseClient()
