import { Button, Result } from 'antd'
import Link from 'next/link'

import { appPaths } from '@/config/app-paths'

const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Link href={appPaths.home.getHref()}>
            <Button type="primary">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}

export default NotFoundPage
