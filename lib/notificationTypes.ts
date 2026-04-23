import type { ListMeta } from '@/lib/claimsTypes'

export type NotificationChannel = 'EMAIL' | 'PUSH'

export type Notification = {
  id: number
  user_id: number | null
  content: string | null
  channel: NotificationChannel
  is_read: boolean
  created_at: string
}

export type NotificationListResponse = {
  data: Notification[]
  meta: ListMeta
}

export type MarkAllNotificationsReadResponse = {
  data: { updated: number }
}
