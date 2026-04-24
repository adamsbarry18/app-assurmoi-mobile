import { apiFetchWithAuth } from '@/api/client'
import type { SinisterDetailResponse, SinisterListResponse, SinisterRow } from '@/types/claims'

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
