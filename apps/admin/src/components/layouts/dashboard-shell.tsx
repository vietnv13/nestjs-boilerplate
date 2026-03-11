'use client'

import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import {
  DashboardOutlined,
  FileOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'

import { NotificationBell } from '@/components/layouts/notification-bell'

import type { ReactNode } from 'react'

const { Header, Content } = Layout
const { Text } = Typography

const BRAND = '#002140'
const HEADER_HEIGHT = 48

interface DashboardShellProps {
  children: ReactNode
  user: { email: string }
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    queryClient.clear()
    router.push('/login')
  }

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

  const userDropdownItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => router.push('/dashboard/profile'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      onClick: handleLogout,
    },
  ]

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
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* Logo */}
        <Text
          strong
          style={{
            color: '#ffffff',
            fontSize: 15,
            letterSpacing: 2,
            marginRight: 24,
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
        <Space size={2} style={{ flexShrink: 0 }}>
          <NotificationBell iconColor="rgba(255,255,255,0.85)" />

          <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow={false}>
            <Button type="text" style={{ height: 36, padding: '0 8px' }}>
              <Space size={6}>
                <Avatar
                  size={22}
                  icon={<UserOutlined />}
                  style={{ background: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
                />
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{user.email}</Text>
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
