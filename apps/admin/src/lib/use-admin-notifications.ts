'use client'

import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { useAdminSse } from '@/lib/admin-sse-context'

export interface AdminNotification {
  id: string
  title: string
  description?: string
  createdAt: string
  read: boolean
}

type IncomingNotification = Omit<AdminNotification, 'read'>

const NOTIFICATIONS_QUERY_KEY = ['admin', 'notifications'] as const

function mergeIncoming(
  prev: AdminNotification[],
  incoming: IncomingNotification,
): AdminNotification[] {
  if (prev.some((n) => n.id === incoming.id)) return prev
  return [{ ...incoming, read: false }, ...prev].slice(0, 30)
}

export function useAdminNotifications() {
  const queryClient = useQueryClient()
  const { subscribe, isConnected } = useAdminSse()

  const { data: notifications = [] } = useQuery<AdminNotification[]>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => [],
    staleTime: Infinity,
    initialData: [] as AdminNotification[],
  })

  useEffect(() => {
    return subscribe('notification', (event) => {
      try {
        const incoming = JSON.parse(String(event.data)) as IncomingNotification
        queryClient.setQueryData<AdminNotification[]>(NOTIFICATIONS_QUERY_KEY, (prev = []) =>
          mergeIncoming(prev, incoming),
        )
      } catch {
        // ignore malformed events
      }
    })
  }, [queryClient, subscribe])

  const unreadCount = useMemo(
    () => notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
    [notifications],
  )

  const markRead = (id: string) => {
    queryClient.setQueryData<AdminNotification[]>(NOTIFICATIONS_QUERY_KEY, (prev = []) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const markAllRead = () => {
    queryClient.setQueryData<AdminNotification[]>(NOTIFICATIONS_QUERY_KEY, (prev = []) =>
      prev.map((n) => ({ ...n, read: true })),
    )
  }

  return { notifications, unreadCount, markRead, markAllRead, isConnected }
}
