import { apiFetchWithAuth } from '@/lib/api'
import type {
  DocumentUploadResponse,
  FolderDetailResponse,
  FolderListResponse,
  FolderStepCreateResponse,
  SinisterDetailResponse,
  SinisterListResponse,
  SinisterRow
} from '@/lib/claimsTypes'

export type CreateSinisterBody = {
  vehicle_plate: string
  call_datetime: string
  incident_datetime: string
  description?: string | null
  driver_first_name?: string | null
  driver_last_name?: string | null
  is_driver_insured?: boolean
  driver_responsability?: boolean
  driver_engaged_responsibility?: 0 | 50 | 100 | null
  insured_user_id?: number | null
  cni_driver?: number | null
  vehicle_registration_doc_id?: number | null
  insurance_certificate_id?: number | null
}

export async function fetchSinisters(
  query?: Record<string, string | number | undefined>
): Promise<SinisterListResponse> {
  const p = new URLSearchParams()
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === '') continue
      p.set(k, String(v))
    }
  }
  const qs = p.toString()
  return apiFetchWithAuth<SinisterListResponse>(`/api/sinisters${qs ? `?${qs}` : ''}`)
}

export async function fetchSinister(id: number): Promise<SinisterDetailResponse> {
  return apiFetchWithAuth<SinisterDetailResponse>(`/api/sinisters/${id}`)
}

export async function createSinister(body: CreateSinisterBody): Promise<{ data: SinisterRow }> {
  return apiFetchWithAuth<{ data: SinisterRow }>('/api/sinisters', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

/** Mise à jour partielle (champs liés documents, etc.) — interdit si sinistre déjà validé. */
export async function updateSinister(
  id: number,
  body: Partial<{
    cni_driver: number | null
    vehicle_registration_doc_id: number | null
    insurance_certificate_id: number | null
  }>
): Promise<SinisterDetailResponse> {
  return apiFetchWithAuth<SinisterDetailResponse>(`/api/sinisters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function validateSinister(id: number): Promise<{
  data: SinisterRow
  message?: string
  meta?: {
    folder_created?: boolean
    folder_id?: number | null
    dossier_complet?: boolean
  }
}> {
  return apiFetchWithAuth(`/api/sinisters/${id}/validate`, {
    method: 'PATCH'
  })
}

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

/** multipart/form-data : `file` + `type` (ex. RIB) */
export async function uploadDocument(form: FormData): Promise<DocumentUploadResponse> {
  return apiFetchWithAuth<DocumentUploadResponse>('/api/documents', {
    method: 'POST',
    body: form
  })
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
