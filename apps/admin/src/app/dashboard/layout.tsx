import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { appPaths } from '@/config/app-paths'
import { env } from '@/config/env'
import { DashboardShell } from '@/components/layouts/dashboard-shell'

import type { ReactNode } from 'react'

interface AdminSession {
  user: { id: string; email: string; role: string | null }
  session: { id: string; expiresAt: string; ipAddress: string | null; userAgent: string | null }
}

const DashboardLayout = async ({ children }: { children: ReactNode }) => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect(appPaths.auth.login.getHref('/dashboard'))
  }

  let session: AdminSession | null = null
  try {
    const response = await fetch(`${env.API_UPSTREAM_BASE_URL}/api/admin/auth/session`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (response.ok) {
      session = (await response.json()) as AdminSession
    }
  } catch {
    // network error
  }

  if (!session) {
    redirect(appPaths.auth.login.getHref('/dashboard'))
  }

  return <DashboardShell user={session.user}>{children}</DashboardShell>
}

export default DashboardLayout
