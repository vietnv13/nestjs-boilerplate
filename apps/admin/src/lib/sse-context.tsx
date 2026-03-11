'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { sseClient } from '@/lib/sse-client'

import type { SseHandler } from '@/lib/sse-client'

interface SseContextValue {
  isConnected: boolean
  subscribe: (eventName: string, handler: SseHandler) => () => void
}

const SseContext = createContext<SseContextValue | null>(null)

export function SseProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(sseClient.isConnected)

  useEffect(() => {
    const disconnect = sseClient.connect('/api/admin/sse/stream')
    const unsubscribeStatus = sseClient.subscribeStatus(setIsConnected)
    // Keep the connection alive even if no component listens yet.
    const unsubscribeReady = sseClient.subscribe('ready', () => setIsConnected(true))
    // If the server emits an SSE "error" event, force a reconnect with backoff.
    const unsubscribeServerError = sseClient.subscribe('error', () => sseClient.forceReconnect())

    return () => {
      unsubscribeServerError()
      unsubscribeReady()
      unsubscribeStatus()
      disconnect()
    }
  }, [])

  const value = useMemo<SseContextValue>(
    () => ({
      isConnected,
      subscribe: (eventName, handler) => sseClient.subscribe(eventName, handler),
    }),
    [isConnected],
  )

  return <SseContext.Provider value={value}>{children}</SseContext.Provider>
}

export function useSse() {
  const ctx = useContext(SseContext)
  if (!ctx) {
    throw new Error('useSse must be used within <SseProvider />')
  }
  return ctx
}
