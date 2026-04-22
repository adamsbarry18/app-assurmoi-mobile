import { getApiBaseUrl } from '@/lib/config'
import { ApiRequestError } from '@/lib/apiErrors'
import type { AuthUser, LoginResponse, MeResponse, RefreshResponse } from './types'

function buildUrl (path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

async function parseJsonOrThrow (res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

export async function loginRequest (
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(buildUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  const data = await parseJsonOrThrow(res)
  if (!res.ok) {
    const body = data as { message?: string }
    throw new ApiRequestError(
      body?.message || `HTTP ${res.status}`,
      res.status,
      body as { message?: string; code?: string }
    )
  }
  return data as LoginResponse
}

export async function refreshRequest (refreshToken: string): Promise<RefreshResponse> {
  const res = await fetch(buildUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  })
  const data = await parseJsonOrThrow(res)
  if (!res.ok) {
    const body = data as { message?: string }
    throw new ApiRequestError(
      body?.message || `HTTP ${res.status}`,
      res.status,
      body as { message?: string; code?: string }
    )
  }
  return data as RefreshResponse
}

export async function meRequest (accessToken: string): Promise<AuthUser> {
  const res = await fetch(buildUrl('/api/auth/me'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  })
  const data = await parseJsonOrThrow(res)
  if (!res.ok) {
    const body = data as { message?: string }
    throw new ApiRequestError(
      body?.message || `HTTP ${res.status}`,
      res.status,
      body as { message?: string; code?: string }
    )
  }
  return (data as MeResponse).data
}

export async function forgotPasswordRequest (email: string): Promise<void> {
  const res = await fetch(buildUrl('/api/auth/forgot-password'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  })
  const data = await parseJsonOrThrow(res)
  if (!res.ok) {
    const body = data as { message?: string }
    throw new ApiRequestError(
      body?.message || `HTTP ${res.status}`,
      res.status,
      body as { message?: string; code?: string }
    )
  }
}

export async function logoutRequest (accessToken: string): Promise<void> {
  const res = await fetch(buildUrl('/api/auth/logout'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  })
  if (!res.ok && res.status !== 401) {
    const data = await parseJsonOrThrow(res)
    const body = data as { message?: string }
    throw new ApiRequestError(
      body?.message || `HTTP ${res.status}`,
      res.status
    )
  }
}
