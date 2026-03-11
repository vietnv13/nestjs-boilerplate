'use client'

import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Form, Input, Typography } from 'antd'
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
    <Card
      style={{ width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      styles={{ body: { padding: '32px 40px' } }}
    >
      {/* Brand header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 52,
            background: '#002140',
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <Text strong style={{ color: '#ffffff', fontSize: 20, letterSpacing: 2 }}>
            A
          </Text>
        </div>
        <Title level={3} style={{ margin: 0, color: '#002140' }}>
          Admin Panel
        </Title>
        <Text type="secondary">Sign in to your account</Text>
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
                size="large"
                prefix={<MailOutlined style={{ color: '#002140' }} />}
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
                size="large"
                prefix={<LockOutlined style={{ color: '#002140' }} />}
                placeholder="Enter your password"
                autoComplete="off"
              />
            </Form.Item>
          )}
        />

        <Form.Item style={{ marginBottom: 16, marginTop: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={isPending}
            style={{ background: '#002140', borderColor: '#002140', height: 44 }}
          >
            Sign in
          </Button>
        </Form.Item>

        <Divider style={{ margin: '0 0 16px' }} />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Don&apos;t have an account?{' '}
            <Link href={appPaths.auth.register.getHref()} style={{ color: '#002140' }}>
              Sign up
            </Link>
          </Text>
        </div>
      </Form>
    </Card>
  )
}

export { LoginForm }
