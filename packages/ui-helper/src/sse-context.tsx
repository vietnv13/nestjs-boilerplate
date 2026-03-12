'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { sseClient } from './sse-client'

import type { ReactNode } from 'react'
import type { SseHandler } from './sse-client'

interface SseContextValue {
  isConnected: boolean
  subscribe: (eventName: string, handler: SseHandler) => () => void
}

const SseContext = createContext<SseContextValue | null>(null)

interface SseProviderProps {
  /** SSE endpoint URL, e.g. `/api/sse/stream` */
  url: string
  children: ReactNode
}

/**
 * SseProvider
 *
 * Establishes and manages an SSE connection for the subtree.
 * Uses the shared `sseClient` singleton (reference-counted).
 *
 * @example
 * ```tsx
 * <SseProvider url="/api/admin/sse/stream">
 *   <App />
 * </SseProvider>
 * ```
 */
export function SseProvider({ url, children }: SseProviderProps) {
  const [isConnected, setIsConnected] = useState(sseClient.isConnected)

  useEffect(() => {
    const disconnect = sseClient.connect(url)
    const unsubscribeStatus = sseClient.subscribeStatus(setIsConnected)
    // Keep the connection alive even before any component subscribes.
    const unsubscribeReady = sseClient.subscribe('ready', () => setIsConnected(true))
    // Force a reconnect with backoff if the server emits an 'error' event.
    const unsubscribeError = sseClient.subscribe('error', () => sseClient.forceReconnect())

    return () => {
      unsubscribeError()
      unsubscribeReady()
      unsubscribeStatus()
      disconnect()
    }
  }, [url])

  const value = useMemo<SseContextValue>(
    () => ({
      isConnected,
      subscribe: (eventName, handler) => sseClient.subscribe(eventName, handler),
    }),
    [isConnected],
  )

  return <SseContext.Provider value={value}>{children}</SseContext.Provider>
}

/**
 * useSse — access the SSE connection from any component inside `<SseProvider>`.
 *
 * @example
 * ```tsx
 * const { isConnected, subscribe } = useSse()
 *
 * useEffect(() => {
 *   return subscribe('notification', (e) => console.log(e.data))
 * }, [subscribe])
 * ```
 */
export function useSse(): SseContextValue {
  const ctx = useContext(SseContext)
  if (!ctx) {
    throw new Error('useSse must be used within <SseProvider />')
  }
  return ctx
}
