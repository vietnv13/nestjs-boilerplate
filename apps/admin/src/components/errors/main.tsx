'use client'

import { Button, Result } from 'antd'

export const MainErrorFallback = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="alert"
    >
      <Result
        status="error"
        title="Application Error"
        subTitle="Something went wrong. Please try refreshing the page."
        extra={
          <Button
            type="primary"
            onClick={() => globalThis.location.assign(globalThis.location.origin)}
          >
            Refresh Page
          </Button>
        }
      />
    </div>
  )
}
