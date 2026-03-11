import { QueryClient } from '@tanstack/react-query'
import { redirect } from 'next/navigation'

import { appPaths } from '@/config/app-paths'
import { $api } from '@/lib/fetch-client'
import { DashboardShell } from '@/components/layouts/dashboard-shell'

import type { ReactNode } from 'react'

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient()

  let user: { email: string } | null = null
  try {
    user = await queryClient.fetchQuery($api.queryOptions('get', '/api/auth/session'))
  } catch {
    // session fetch failed (401 / network error)
  }

  if (!user) {
    redirect(appPaths.auth.login.getHref('/dashboard'))
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}

export default DashboardLayout
