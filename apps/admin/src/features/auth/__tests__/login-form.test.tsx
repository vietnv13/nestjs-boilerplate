import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen, waitFor } from '@/testing'

import { LoginForm } from '../components/login-form'

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading and fields', () => {
    render(<LoginForm />)

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByPlaceholderText(/enter your email/i)
    await user.clear(emailInput)
    await user.type(emailInput, 'not-an-email')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const passwordInput = screen.getByPlaceholderText(/enter your password/i)
    await user.clear(passwordInput)
    await user.type(passwordInput, 'abc')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('starts with empty fields', () => {
    render(<LoginForm />)

    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue('')
    expect(screen.getByPlaceholderText(/enter your password/i)).toHaveValue('')
  })

  it('has link to register page', () => {
    render(<LoginForm />)

    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register')
  })
})
