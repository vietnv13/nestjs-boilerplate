'use client'

import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Typography } from 'antd'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { appPaths } from '@/config/app-paths'
import { $api } from '@/lib/fetch-client'

import { registerSchema } from '../schemas'

import type { RegisterFormData } from '../schemas'

const { Title, Text, Link } = Typography

const RegisterForm = () => {
  const router = useRouter()
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: 'user@example.com',
      name: 'john_doe',
      password: 'Pass123456',
      confirmPassword: 'Pass123456',
    },
  })

  const { mutateAsync, isPending } = $api.useMutation('post', '/api/auth/register')

  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword: _confirmPassword, ...payload } = data
    await mutateAsync(
      { body: payload },
      {
        onError: (error) => toast.error(error.detail ?? 'Registration failed'),
      },
    )
    router.push(appPaths.auth.login.getHref())
  }

  return (
    <Card style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Create account
        </Title>
        <Text type="secondary">Fill in the details below to register</Text>
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
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Username"
              validateStatus={fieldState.invalid ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input
                {...field}
                prefix={<UserOutlined />}
                placeholder="Enter your username"
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
        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Form.Item
              label="Confirm Password"
              validateStatus={fieldState.invalid ? 'error' : ''}
              help={fieldState.error?.message}
            >
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder="Confirm your password"
                autoComplete="off"
              />
            </Form.Item>
          )}
        />

        <Form.Item style={{ marginBottom: 8 }}>
          <Button type="primary" htmlType="submit" block loading={isPending}>
            Create account
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Already have an account? <Link href={appPaths.auth.login.getHref()}>Sign in</Link>
          </Text>
        </div>
      </Form>
    </Card>
  )
}

export { RegisterForm }
