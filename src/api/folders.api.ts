import { apiFetchWithAuth } from '@/api/client'
import type {
  FolderDetailResponse,
  FolderListResponse,
  FolderStepCreateResponse
} from '@/types/claims'

export async function fetchFolders(
  query?: Record<string, string | number | undefined>
): Promise<FolderListResponse> {
  const p = new URLSearchParams()
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === '') continue
      p.set(k, String(v))
    }
  }
  const qs = p.toString()
  return apiFetchWithAuth<FolderListResponse>(`/api/folders${qs ? `?${qs}` : ''}`)
}

export async function fetchFolder(id: number): Promise<FolderDetailResponse> {
  return apiFetchWithAuth<FolderDetailResponse>(`/api/folders/${id}`)
}

export async function postFolderRibStep(
  folderId: number,
  documentId: number
): Promise<FolderStepCreateResponse> {
  return apiFetchWithAuth<FolderStepCreateResponse>(`/api/folders/${folderId}/steps`, {
    method: 'POST',
    body: JSON.stringify({
      step_type: 'S2_RIB',
      document_id: documentId
    })
  })
}

export async function createFolder(body: {
  sinister_id: number
  scenario?: 'REPAIRABLE' | 'TOTAL_LOSS'
  force?: boolean
}): Promise<FolderDetailResponse> {
  return apiFetchWithAuth<FolderDetailResponse>('/api/folders', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function assignFolderOfficer(
  folderId: number,
  assigned_officer_id: number
): Promise<FolderDetailResponse> {
  return apiFetchWithAuth<FolderDetailResponse>(`/api/folders/${folderId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_officer_id })
  })
}

export async function closeFolder(folderId: number): Promise<FolderDetailResponse> {
  return apiFetchWithAuth<FolderDetailResponse>(`/api/folders/${folderId}/close`, {
    method: 'PATCH'
  })
}

export async function patchFolderScenario(
  folderId: number,
  scenario: 'REPAIRABLE' | 'TOTAL_LOSS'
): Promise<FolderDetailResponse> {
  return apiFetchWithAuth<FolderDetailResponse>(`/api/folders/${folderId}/scenario`, {
    method: 'PATCH',
    body: JSON.stringify({ scenario })
  })
}

export async function postFolderStep(
  folderId: number,
  body: {
    step_type: string
    value?: string | null
    document_id?: number | null
  }
): Promise<FolderStepCreateResponse> {
  return apiFetchWithAuth<FolderStepCreateResponse>(`/api/folders/${folderId}/steps`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}
