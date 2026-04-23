import { apiFetchWithAuth } from '@/lib/api'

export type DocumentMeta = {
  id: number
  type: string
  is_validated: boolean
  uploaded_at?: string | null
  storage_url: string
}

export type DocumentMetaResponse = {
  data: DocumentMeta
}

export type DocumentValidateResponse = {
  message?: string
  data: { id: number; is_validated: boolean; type?: string }
}

/**
 * Métadonnées sans téléchargement du binaire (GET `?meta=1`).
 */
export async function fetchDocumentMeta(id: number): Promise<DocumentMetaResponse> {
  return apiFetchWithAuth<DocumentMetaResponse>(`/api/documents/${id}?meta=1`)
}

/**
 * Valider un document en interne (gestionnaire / admin).
 */
export async function validateDocumentApi(id: number): Promise<DocumentValidateResponse> {
  return apiFetchWithAuth<DocumentValidateResponse>(`/api/documents/${id}/validate`, {
    method: 'PATCH'
  })
}

export type YousignSignerPayload = {
  first_name: string
  last_name: string
  email: string
  locale?: string
  sign_page?: number
  sign_x?: number
  sign_y?: number
  signature_request_name?: string
}

export type YousignSignResponseData = {
  document_id: number
  signature_request_id?: string | null
  yousign_document_id?: string | null
  status?: string | null
  signature_link?: string | null
  signers?: unknown
}

export type YousignSignResponse = {
  data: YousignSignResponseData
}

/**
 * Crée / active une demande de signature Yousign (document déjà validé en interne, PDF ou DOCX).
 */
export async function signDocumentYousign(
  id: number,
  body: YousignSignerPayload
): Promise<YousignSignResponse> {
  const raw: Record<string, unknown> = {
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    email: body.email.trim()
  }
  if (body.locale != null && body.locale !== '') {
    raw.locale = body.locale.trim()
  } else {
    raw.locale = 'fr'
  }
  if (body.signature_request_name != null && body.signature_request_name.trim() !== '') {
    raw.signature_request_name = body.signature_request_name.trim()
  }
  if (body.sign_page != null && Number.isFinite(body.sign_page)) {
    raw.sign_page = body.sign_page
  }
  if (body.sign_x != null && Number.isFinite(body.sign_x)) {
    raw.sign_x = body.sign_x
  }
  if (body.sign_y != null && Number.isFinite(body.sign_y)) {
    raw.sign_y = body.sign_y
  }
  return apiFetchWithAuth<YousignSignResponse>(`/api/documents/${id}/sign`, {
    method: 'POST',
    body: JSON.stringify(raw)
  })
}
