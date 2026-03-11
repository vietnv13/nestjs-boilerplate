'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { adminSseClient } from '@/lib/admin-sse-client'

import type { SseHandler } from '@/lib/admin-sse-client'

interface AdminSseContextValue {
  isConnected: boolean
  subscribe: (eventName: string, handler: SseHandler) => () => void
}

const AdminSseContext = createContext<AdminSseContextValue | null>(null)

export function AdminSseProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(adminSseClient.isConnected)

  useEffect(() => {
    const disconnect = adminSseClient.connect('/api/admin/sse/stream')
    const unsubscribeStatus = adminSseClient.subscribeStatus(setIsConnected)
    // Keep the connection alive even if no component listens yet.
    const unsubscribeReady = adminSseClient.subscribe('ready', () => setIsConnected(true))
    const unsubscribePing = adminSseClient.subscribe('ping', () => {})
    // If the server emits an SSE "error" event, force a reconnect with backoff.
    const unsubscribeServerError = adminSseClient.subscribe('error', () =>
      adminSseClient.forceReconnect(),
    )

    return () => {
      unsubscribeServerError()
      unsubscribePing()
      unsubscribeReady()
      unsubscribeStatus()
      disconnect()
    }
  }, [])

  const value = useMemo<AdminSseContextValue>(
    () => ({
      isConnected,
      subscribe: (eventName, handler) => adminSseClient.subscribe(eventName, handler),
    }),
    [isConnected],
  )

  return <AdminSseContext.Provider value={value}>{children}</AdminSseContext.Provider>
}

export function useAdminSse() {
  const ctx = useContext(AdminSseContext)
  if (!ctx) {
    throw new Error('useAdminSse must be used within <AdminSseProvider />')
  }
  return ctx
}
