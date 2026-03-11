'use client'

import { Spin } from 'antd'

export default function DashboardLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
    >
      <Spin size="large" />
    </div>
  )
}
