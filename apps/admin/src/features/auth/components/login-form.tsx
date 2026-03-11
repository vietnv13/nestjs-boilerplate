'use client'

import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Typography } from 'antd'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { appPaths } from '@/config/app-paths'
import { $api } from '@/lib/fetch-client'

import { loginSchema } from '../schemas'

import type { LoginFormData } from '../schemas'

const { Title, Text, Link } = Typography

const LoginForm = () => {
  const router = useRouter()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'user@example.com',
      password: 'Pass123456',
    },
  })

  const { mutateAsync, isPending } = $api.useMutation('post', '/api/auth/login', {
    onError: (error) => toast.error(error.detail ?? 'Login failed'),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await mutateAsync({ body: data })
      router.push('/dashboard')
    } catch {
      // error already surfaced via onError toast
    }
  }

  return (
    <Card style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Sign in
        </Title>
        <Text type="secondary">Enter your credentials to access the admin panel</Text>
      </div>

      <Form layout="vertical" onFinish={form.handleSubmit(onSubmit)}>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Email"
              validateStatus={fieldState.invalid ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input
                {...field}
                prefix={<MailOutlined />}
                placeholder="Enter your email"
                autoComplete="off"
              />
            </Form.Item>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Password"
              validateStatus={fieldState.invalid ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="off"
              />
            </Form.Item>
          )}
        />

        <Form.Item style={{ marginBottom: 8 }}>
          <Button type="primary" htmlType="submit" block loading={isPending}>
            Sign in
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Don&apos;t have an account? <Link href={appPaths.auth.register.getHref()}>Sign up</Link>
          </Text>
        </div>
      </Form>
    </Card>
  )
}

export { LoginForm }
