import { apiFetchWithAuth } from '@/lib/api'
import type { UserSummary } from '@/lib/claimsTypes'

export type HistoryEntityType = 'sinister' | 'document' | 'folder' | 'folder_step' | 'user'

export type HistoryLogRow = {
  id: number
  user_id?: number | null
  entity_type?: string | null
  entity_id?: number | null
  action?: string | null
  created_at?: string
  actor?: UserSummary | null
}

export type HistoryListResponse = {
  data: HistoryLogRow[]
}

export async function fetchEntityHistory(
  entityType: HistoryEntityType,
  entityId: number
): Promise<HistoryListResponse> {
  const q = new URLSearchParams({
    entity_type: entityType,
    entity_id: String(entityId)
  })
  return apiFetchWithAuth<HistoryListResponse>(`/api/history?${q.toString()}`)
}
