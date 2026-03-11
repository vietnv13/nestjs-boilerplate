'use client'

import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import { Badge, Button, Empty, Popover, Typography } from 'antd'
import { useState } from 'react'

const { Text } = Typography

interface Notification {
  id: number
  title: string
  description: string
  time: string
  read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'New user registered',
    description: 'A new user has joined the system',
    time: '5 min ago',
    read: false,
  },
  {
    id: 2,
    title: 'System backup completed',
    description: 'Daily backup finished successfully',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    title: 'Weekly report ready',
    description: 'Your weekly analytics report is available',
    time: '2 hours ago',
    read: true,
  },
]

interface NotificationBellProps {
  iconColor?: string
}

export function NotificationBell({ iconColor = '#002140' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const markRead = (id: number) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  const content = (
    <div style={{ width: 300 }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 8,
          borderBottom: '1px solid #f0f0f0',
          marginBottom: 2,
        }}
      >
        <Text strong style={{ fontSize: 13 }}>
          Notifications
        </Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={markAllRead}
            style={{ padding: 0, fontSize: 12, color: '#002140' }}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <Empty
          description="No notifications"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '16px 0' }}
        />
      ) : (
        <div>
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => markRead(item.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '7px 6px',
                background: item.read ? 'transparent' : 'rgba(0,33,64,0.04)',
                borderRadius: 5,
                cursor: 'pointer',
                marginBottom: 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ display: 'block', fontSize: 12, fontWeight: item.read ? 400 : 600 }}>
                  {item.title}
                </Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                  {item.description}
                </Text>
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {item.time}
                </Text>
              </div>
              {!item.read && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    background: '#002140',
                    borderRadius: '50%',
                    flexShrink: 0,
                    marginTop: 4,
                    marginLeft: 6,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      arrow={false}
      styles={{ container: { padding: '8px 10px' } }}
    >
      <Badge count={unreadCount} size="small">
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 16 }} />}
          style={{ color: iconColor, width: 36, height: 36 }}
        />
      </Badge>
    </Popover>
  )
}
