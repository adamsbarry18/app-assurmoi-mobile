import { apiFetchWithAuth } from '@/api/client'
import type {
  MarkAllNotificationsReadResponse,
  Notification,
  NotificationListResponse
} from '@/types/notification'

export type FetchNotificationsQuery = {
  is_read?: boolean
  limit?: number
  offset?: number
}

/**
 * Nombre de notifications **non lues** (même logique filtre `is_read=false`).
 */
export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await apiFetchWithAuth<NotificationListResponse>(
    '/api/notifications?is_read=false&limit=1&offset=0'
  )
  return res.meta?.total ?? 0
}

export async function fetchNotifications(
  query?: FetchNotificationsQuery
): Promise<NotificationListResponse> {
  const p = new URLSearchParams()
  if (query) {
    if (query.is_read === true) p.set('is_read', 'true')
    if (query.is_read === false) p.set('is_read', 'false')
    if (query.limit != null) p.set('limit', String(query.limit))
    if (query.offset != null) p.set('offset', String(query.offset))
  }
  const qs = p.toString()
  return apiFetchWithAuth<NotificationListResponse>(`/api/notifications${qs ? `?${qs}` : ''}`)
}

export async function markNotificationAsRead(id: number): Promise<{
  data: Notification
}> {
  return apiFetchWithAuth<{ data: Notification }>(`/api/notifications/${id}/read`, {
    method: 'PATCH'
  })
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  return apiFetchWithAuth<MarkAllNotificationsReadResponse>('/api/notifications/mark-all-read', {
    method: 'POST'
  })
}
