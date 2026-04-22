import { apiFetchWithAuth } from '@/lib/api'
import type { AuthUser } from '@/lib/auth/types'

export type ListUsersResponse = {
  data: AuthUser[]
  meta: { total: number; limit: number; offset: number }
}

export type CreateUserBody = {
  username: string
  email: string
  password: string
  role: string
  first_name?: string | null
  last_name?: string | null
  is_active?: boolean
}

export async function listUsers (params?: {
  limit?: number
  offset?: number
  search?: string
  role?: string
  is_active?: boolean
}): Promise<ListUsersResponse> {
  const q = new URLSearchParams()
  if (params?.limit != null) q.set('limit', String(params.limit))
  if (params?.offset != null) q.set('offset', String(params.offset))
  if (params?.search) q.set('search', params.search)
  if (params?.role) q.set('role', params.role)
  if (params?.is_active !== undefined) {
    q.set('is_active', params.is_active ? 'true' : 'false')
  }
  const suffix = q.toString() ? `?${q.toString()}` : ''
  return apiFetchWithAuth<ListUsersResponse>(`/api/users${suffix}`)
}

export async function createUser (
  body: CreateUserBody
): Promise<{ data: AuthUser }> {
  return apiFetchWithAuth<{ data: AuthUser }>('/api/users', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export type UpdateUserBody = {
  username?: string
  email?: string
  password?: string
  role?: string
  first_name?: string | null
  last_name?: string | null
  is_active?: boolean
}

export async function getUserById (id: number): Promise<{ data: AuthUser }> {
  return apiFetchWithAuth<{ data: AuthUser }>(`/api/users/${id}`)
}

export async function updateUser (
  id: number,
  body: UpdateUserBody
): Promise<{ data: AuthUser }> {
  return apiFetchWithAuth<{ data: AuthUser }>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function deactivateUserApi (id: number): Promise<{
  message: string
  data: AuthUser
}> {
  return apiFetchWithAuth(`/api/users/${id}/deactivate`, { method: 'PATCH' })
}

export async function deleteUserApi (id: number): Promise<{
  message: string
  status: number
}> {
  return apiFetchWithAuth(`/api/users/${id}`, { method: 'DELETE' })
}
