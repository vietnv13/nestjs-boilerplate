import { AntdRegistry } from '@ant-design/nextjs-registry'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { Toaster } from 'sonner'

import { AppProvider } from '@/app/provide'
import { SseProvider } from '@/lib/sse-context'
import { NavigationProgress } from '@/components/navigation-progress'
import { $api } from '@/lib/fetch-client'

import './globals.css'

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const viewport: Viewport = {
  initialScale: 1,
  width: 'device-width',
}

export const metadata: Metadata = {
  title: {
    template: '%s · Admin',
    default: 'Admin',
  },
  description: 'Admin panel',
}

const Layout = async ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery($api.queryOptions('get', '/api/auth/session'))

  const dehydratedState = dehydrate(queryClient)

  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AppProvider>
            <SseProvider>
              <NavigationProgress />
              <HydrationBoundary state={dehydratedState}>
                {children}
                <Toaster />
              </HydrationBoundary>
            </SseProvider>
          </AppProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}

export default Layout

export const dynamic = 'force-dynamic'
