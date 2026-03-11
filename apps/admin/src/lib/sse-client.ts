'use client'

export type SseHandler = (event: MessageEvent) => void

type StatusListener = (connected: boolean) => void

class SseClient {
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

  connect(url: string) {
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

  subscribe(eventName: string, handler: SseHandler) {
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

  subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener)
    listener(this.connected)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  get isConnected() {
    return this.connected
  }

  forceReconnect() {
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

    // Re-attach listeners for this new EventSource instance.
    for (const [eventName, listener] of this.listenersByEvent) {
      this.eventSource.addEventListener(eventName, listener)
      this.attachedEventNames.add(eventName)
    }

    // If there were handlers registered before connect, ensure listeners exist.
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
    if (this.eventSource) {
      this.eventSource.removeEventListener(eventName, listener)
    }
    this.listenersByEvent.delete(eventName)
    this.attachedEventNames.delete(eventName)
  }
}

export const sseClient = new SseClient()
