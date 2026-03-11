'use client'

import {
  ClockCircleOutlined,
  GlobalOutlined,
  IdcardOutlined,
  LaptopOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Card, Col, Descriptions, Row, Skeleton, Space, Tag, Typography } from 'antd'

import { $api } from '@/lib/fetch-client'

const { Title, Text } = Typography

interface SessionData {
  user: { id: string; email: string; role: string | null }
  session: {
    id: string
    expiresAt: string
    ipAddress: string | null
    userAgent: string | null
  }
}

export default function ProfilePage() {
  const { data, isLoading } = $api.useQuery('get', '/api/auth/session')

  const session = data as SessionData | undefined
  const user = session?.user
  const sessionInfo = session?.session

  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
        My Profile
      </Title>

      <Row gutter={[24, 24]}>
        {/* Avatar card */}
        <Col xs={24} md={7}>
          <Card style={{ textAlign: 'center' }}>
            <Skeleton loading={isLoading} avatar active paragraph={{ rows: 2 }}>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                style={{ background: '#002140', marginBottom: 16 }}
              />
              <Title level={5} style={{ margin: '0 0 4px' }}>
                {user?.email ?? '—'}
              </Title>
              <Tag color="geekblue" style={{ marginTop: 4 }}>
                {user?.role?.toUpperCase() ?? 'ADMIN'}
              </Tag>
            </Skeleton>
          </Card>
        </Col>

        {/* Account info */}
        <Col xs={24} md={17}>
          <Card
            title={
              <Space size={6}>
                <IdcardOutlined />
                Account Information
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Skeleton loading={isLoading} active paragraph={{ rows: 3 }}>
              <Descriptions column={1} size="large">
                <Descriptions.Item
                  label={
                    <Space size={6}>
                      <MailOutlined />
                      Email
                    </Space>
                  }
                >
                  {user?.email}
                </Descriptions.Item>
                <Descriptions.Item
                  label={
                    <Space size={6}>
                      <IdcardOutlined />
                      User ID
                    </Space>
                  }
                >
                  <Text copyable code style={{ fontSize: 12 }}>
                    {user?.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  <Tag color="geekblue">{user?.role?.toUpperCase() ?? 'N/A'}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Skeleton>
          </Card>

          <Card
            title={
              <Space size={6}>
                <ClockCircleOutlined />
                Current Session
              </Space>
            }
          >
            <Skeleton loading={isLoading} active paragraph={{ rows: 3 }}>
              <Descriptions column={1} size="large">
                <Descriptions.Item
                  label={
                    <Space size={6}>
                      <ClockCircleOutlined />
                      Expires
                    </Space>
                  }
                >
                  {sessionInfo?.expiresAt ? new Date(sessionInfo.expiresAt).toLocaleString() : '—'}
                </Descriptions.Item>
                {sessionInfo?.ipAddress && (
                  <Descriptions.Item
                    label={
                      <Space size={6}>
                        <GlobalOutlined />
                        IP Address
                      </Space>
                    }
                  >
                    <Text code>{sessionInfo.ipAddress}</Text>
                  </Descriptions.Item>
                )}
                {sessionInfo?.userAgent && (
                  <Descriptions.Item
                    label={
                      <Space size={6}>
                        <LaptopOutlined />
                        Browser
                      </Space>
                    }
                  >
                    <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                      {sessionInfo.userAgent}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Skeleton>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
