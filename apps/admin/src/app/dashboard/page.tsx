'use client'

import { CloudServerOutlined, FileOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons'
import { Card, Col, Row, Statistic, Typography } from 'antd'

const { Title, Text } = Typography

const stats = [
  {
    title: 'Total Users',
    value: 0,
    icon: <TeamOutlined style={{ fontSize: 28, color: '#002140' }} />,
    trend: '+0%',
    bg: 'rgba(0,33,64,0.06)',
  },
  {
    title: 'Total Assets',
    value: 0,
    icon: <FileOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    trend: '+0%',
    bg: 'rgba(22,119,255,0.06)',
  },
  {
    title: 'Active Sessions',
    value: 0,
    icon: <CloudServerOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    trend: '0 online',
    bg: 'rgba(82,196,26,0.06)',
  },
  {
    title: 'Growth',
    value: 0,
    suffix: '%',
    icon: <RiseOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
    trend: 'this month',
    bg: 'rgba(250,140,22,0.06)',
  },
]

export default function DashboardPage() {
  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 8 }}>
        Overview
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Welcome back. Here&apos;s a summary of your system.
      </Text>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col key={s.title} xs={24} sm={12} xl={6}>
            <Card styles={{ body: { padding: '20px 24px' } }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <Statistic
                  title={<Text style={{ fontSize: 13, color: '#666' }}>{s.title}</Text>}
                  value={s.value}
                  suffix={s.suffix}
                  styles={{ content: { fontSize: 28, fontWeight: 600, color: '#002140' } }}
                />
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: s.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                {s.trend}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
