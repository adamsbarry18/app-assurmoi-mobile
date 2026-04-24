import { apiFetchWithAuth } from '@/api/client'
import type { AuthUser, ListUserRow } from '@/auth/types'
import type { ListMeta } from '@/types/claims'

export type ListUsersResponse = {
  data: ListUserRow[]
  meta: ListMeta
}

export async function fetchUserById(id: number): Promise<{ data: AuthUser }> {
  return apiFetchWithAuth<{ data: AuthUser }>(`/api/users/${id}`)
}

export async function listUsers(query: {
  limit: number
  offset: number
  search?: string
  /** Liste assurés ou liste équipe (API `user_scope`). */
  userScope?: 'insured' | 'staff'
}): Promise<ListUsersResponse> {
  const p = new URLSearchParams()
  p.set('limit', String(query.limit))
  p.set('offset', String(query.offset))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.userScope) p.set('user_scope', query.userScope)
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

export async function provisionInsuredUser(body: {
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  /** `true` : envoie l’e-mail 1er accès. `false` ou omis (défaut) : fiche seule, renvoi manuel. */
  send_welcome_email?: boolean
}): Promise<{ message: string; data: AuthUser }> {
  return apiFetchWithAuth('/api/users/insured-provision', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function resendInsuredWelcome(id: number): Promise<{ message: string }> {
  return apiFetchWithAuth(`/api/users/${id}/resend-welcome`, {
    method: 'POST'
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
