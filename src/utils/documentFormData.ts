import Form from 'form-data'
import type { PickedDocumentFile } from '@/utils/pickDocument'

/**
 * Classe `form-data` (npm) — utile pour scripts Node / tests alignés sur le même multipart.
 * L’app mobile utilise `buildDocumentMultipartForm` avec le **FormData natif** (fichiers `{ uri, name, type }`).
 */
export { Form as NodeFormData }

/**
 * Corps `multipart/form-data` pour `POST /api/documents` (champs `type` + `file`), parsé côté API par **formidable**.
 */
export function buildDocumentMultipartForm(
  type: string,
  file: PickedDocumentFile
): globalThis.FormData {
  const body = new FormData()
  body.append('type', type)
  body.append('file', { uri: file.uri, name: file.name, type: file.mime } as never)
  return body
}
