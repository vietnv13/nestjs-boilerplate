'use client'

import { ConfigProvider } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { MainErrorFallback } from '@/components/errors/main'
import { env } from '@/config/env'
import { queryConfig } from '@/lib/react-query'

const BRAND = '#002140'

interface AppProviderProperties {
  children: React.ReactNode
}

export const AppProvider = ({ children }: AppProviderProperties) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  )

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: BRAND,
            colorLink: BRAND,
            borderRadius: 6,
          },
          components: {
            Menu: {
              darkItemBg: BRAND,
              darkSubMenuItemBg: '#001529',
              darkItemSelectedBg: '#1677ff',
              darkItemHoverBg: '#003a6b',
              darkItemColor: 'rgba(255,255,255,0.65)',
              darkItemHoverColor: '#ffffff',
              darkItemSelectedColor: '#ffffff',
            },
            Layout: {
              siderBg: BRAND,
              headerBg: '#ffffff',
              bodyBg: '#f0f2f5',
            },
            Button: {
              primaryColor: '#ffffff',
            },
          },
        }}
      >
        <QueryClientProvider client={queryClient}>
          {env.NODE_ENV === 'development' && <ReactQueryDevtools />}
          {children}
        </QueryClientProvider>
      </ConfigProvider>
    </ErrorBoundary>
  )
}
