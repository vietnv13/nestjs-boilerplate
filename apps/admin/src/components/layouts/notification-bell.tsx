'use client'

import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import { Badge, Button, Empty, Popover, Typography } from 'antd'

import { useNotifications } from '@/lib/use-notifications'

const { Text } = Typography

interface NotificationBellProps {
  iconColor?: string
  buttonSize?: number
  iconSize?: number
}

export function NotificationBell({
  iconColor = '#002140',
  buttonSize = 36,
  iconSize = 18,
}: NotificationBellProps) {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()

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
                {item.description && (
                  <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                    {item.description}
                  </Text>
                )}
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {new Date(item.createdAt).toLocaleString()}
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
      placement="bottomRight"
      arrow={false}
      styles={{ container: { padding: '8px 10px' } }}
    >
      <Badge
        count={unreadCount}
        size="small"
        offset={[-2, 6]}
        styles={{
          indicator: {
            minWidth: 18,
            height: 18,
            lineHeight: '18px',
            fontSize: 11,
            paddingInline: 4,
            borderRadius: 999,
            boxShadow: '0 0 0 2px rgba(0,33,64,1)',
          },
        }}
      >
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: iconSize }} />}
          style={{
            color: iconColor,
            width: buttonSize,
            height: buttonSize,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Badge>
    </Popover>
  )
}
