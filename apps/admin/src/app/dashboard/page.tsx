'use client'

import { Card, Col, Row, Statistic, Typography } from 'antd'
import { DashboardOutlined, FileOutlined, UserOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function DashboardPage() {
  return (
    <div>
      <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
        Overview
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Total Users" value={0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Total Assets" value={0} prefix={<FileOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title="Active Sessions" value={0} prefix={<DashboardOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
