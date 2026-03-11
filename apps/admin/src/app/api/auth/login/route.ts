import { NextResponse } from 'next/server'

import { proxyAuthRequest, setAuthCookies } from '@/lib/auth'

import type { AuthResponse, LoginRequest } from '@/types/auth'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginRequest

  const { data, ok, status } = await proxyAuthRequest<AuthResponse>('/api/admin/auth/login', body)

  if (!ok) {
    return NextResponse.json(data, { status })
  }

  const res = NextResponse.json({ user: data.user })
  setAuthCookies(res, data)

  return res
}
