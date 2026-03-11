'use client'

import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import {
  DashboardOutlined,
  DownOutlined,
  FileOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { NotificationBell } from '@/components/layouts/notification-bell'

import type { ReactNode } from 'react'

const { Header, Content } = Layout
const { Text } = Typography

const BRAND = '#002140'
const HEADER_HEIGHT = 52

interface DashboardShellProps {
  children: ReactNode
  user: { id?: string; email: string; role?: string | null }
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      queryClient.clear()
      router.push('/login')
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, queryClient, router])

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: '/dashboard/users',
      icon: <TeamOutlined />,
      label: 'Users',
      children: [
        {
          key: '/dashboard/users/all',
          label: 'All Users',
          onClick: () => router.push('/dashboard/users'),
        },
        {
          key: '/dashboard/users/roles',
          label: 'Roles & Permissions',
          onClick: () => router.push('/dashboard/users/roles'),
        },
      ],
    },
    {
      key: '/dashboard/assets',
      icon: <FileOutlined />,
      label: 'Assets',
      children: [
        {
          key: '/dashboard/assets/all',
          label: 'All Assets',
          onClick: () => router.push('/dashboard/assets'),
        },
        {
          key: '/dashboard/assets/storage',
          label: 'Storage',
          onClick: () => router.push('/dashboard/assets/storage'),
        },
      ],
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/dashboard/settings'),
    },
  ]

  const userDropdownItems = useMemo(
    () => [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => router.push('/dashboard/profile'),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: isLoggingOut ? 'Signing out…' : 'Sign out',
        danger: true,
        disabled: isLoggingOut,
        onClick: handleLogout,
      },
    ],
    [handleLogout, isLoggingOut, router],
  )

  // Highlight parent if a child route is active
  const selectedKeys = menuItems.flatMap((item) => {
    if (item.children) {
      const base = item.key
      const matched = item.children.find(() => pathname.startsWith(base))
      return matched ? [matched.key, base] : []
    }
    return pathname === item.key || pathname.startsWith(item.key + '/') ? [item.key] : []
  })

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Top navigation bar */}
      <Header
        style={{
          background: BRAND,
          height: HEADER_HEIGHT,
          lineHeight: `${HEADER_HEIGHT}px`,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
        }}
      >
        {/* Logo */}
        <Text
          strong
          style={{
            color: '#ffffff',
            fontSize: 14,
            letterSpacing: 2,
            marginRight: 20,
            flexShrink: 0,
          }}
        >
          ADMIN
        </Text>

        {/* Navigation — stretches to fill available space */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={selectedKeys}
            items={menuItems}
            style={{
              background: BRAND,
              borderBottom: 'none',
              height: HEADER_HEIGHT,
              lineHeight: `${HEADER_HEIGHT}px`,
            }}
          />
        </div>

        {/* Right: notifications + user */}
        <Space size={6} align="center" wrap={false} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          <div style={{ marginTop: 8 }}>
            <NotificationBell iconColor="rgba(255,255,255,0.85)" buttonSize={36} iconSize={18} />
          </div>

          <Dropdown
            menu={{ items: userDropdownItems, selectable: false }}
            placement="bottomRight"
            arrow
            trigger={['click']}
            popupRender={(menu) => (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 10px 8px',
                    borderBottom: '1px solid rgba(5,5,5,0.06)',
                  }}
                >
                  <Avatar
                    size={32}
                    icon={<UserOutlined />}
                    style={{ background: 'rgba(0,33,64,0.10)', color: BRAND, flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <Text style={{ display: 'block', fontSize: 13 }} ellipsis>
                      {user.email}
                    </Text>
                    {user.role && (
                      <Text type="secondary" style={{ display: 'block', fontSize: 11 }} ellipsis>
                        {user.role}
                      </Text>
                    )}
                  </div>
                </div>
                <div style={{ padding: 6 }}>{menu}</div>
              </div>
            )}
          >
            <Button type="text" style={{ height: 36, padding: '0 8px' }}>
              <Space size={6} align="center">
                <Avatar
                  size={24}
                  icon={<UserOutlined />}
                  style={{ background: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                />
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 13,
                    maxWidth: 220,
                  }}
                  ellipsis
                >
                  {user.email}
                </Text>
                <DownOutlined style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }} />
              </Space>
            </Button>
          </Dropdown>
        </Space>
      </Header>

      {/* Page content */}
      <Content
        style={{
          margin: 20,
          padding: 24,
          background: '#ffffff',
          borderRadius: 8,
          minHeight: 280,
        }}
      >
        {children}
      </Content>
    </Layout>
  )
}
