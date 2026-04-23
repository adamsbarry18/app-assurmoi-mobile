import { apiFetchWithAuth } from '@/lib/api'
import type { AuthUser, ListUserRow } from '@/lib/auth/types'
import type { ListMeta } from '@/lib/claimsTypes'

export type ListUsersResponse = {
  data: ListUserRow[]
  meta: ListMeta
}

export async function listUsers(query: {
  limit: number
  offset: number
  search?: string
}): Promise<ListUsersResponse> {
  const p = new URLSearchParams()
  p.set('limit', String(query.limit))
  p.set('offset', String(query.offset))
  if (query.search?.trim()) p.set('search', query.search.trim())
  return apiFetchWithAuth<ListUsersResponse>(`/api/users?${p.toString()}`)
}

export async function updateUser(
  id: number,
  body: {
    first_name?: string | null
    last_name?: string | null
    password?: string
  }
): Promise<{ data: AuthUser }> {
  return apiFetchWithAuth<{ data: AuthUser }>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function activateUserApi(id: number): Promise<unknown> {
  return apiFetchWithAuth(`/api/users/${id}/activate`, { method: 'PATCH' })
}

export async function deactivateUserApi(id: number): Promise<unknown> {
  return apiFetchWithAuth(`/api/users/${id}/deactivate`, { method: 'PATCH' })
}

export async function sendInvite(body: { email: string; role: string }): Promise<unknown> {
  return apiFetchWithAuth('/api/auth/invite', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function resendInvitation(id: number): Promise<unknown> {
  return apiFetchWithAuth(`/api/auth/invitations/${id}/resend`, {
    method: 'POST'
  })
}

export async function cancelInvitation(id: number): Promise<unknown> {
  return apiFetchWithAuth(`/api/auth/invitations/${id}/cancel`, {
    method: 'POST'
  })
}

export type InsuredOptionsResponse = {
  data: AuthUser[]
}

export async function fetchInsuredOptions(params?: {
  search?: string
  limit?: number
}): Promise<InsuredOptionsResponse> {
  const p = new URLSearchParams()
  if (params?.search?.trim()) p.set('search', params.search.trim())
  if (params?.limit != null) p.set('limit', String(params.limit))
  const qs = p.toString()
  return apiFetchWithAuth<InsuredOptionsResponse>(`/api/users/insured-options${qs ? `?${qs}` : ''}`)
}

export async function fetchTrackingOfficerOptions(params?: {
  search?: string
  limit?: number
}): Promise<InsuredOptionsResponse> {
  const p = new URLSearchParams()
  if (params?.search?.trim()) p.set('search', params.search.trim())
  if (params?.limit != null) p.set('limit', String(params.limit))
  const qs = p.toString()
  return apiFetchWithAuth<InsuredOptionsResponse>(
    `/api/users/tracking-officer-options${qs ? `?${qs}` : ''}`
  )
}
