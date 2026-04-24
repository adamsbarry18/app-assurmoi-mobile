import * as DocumentPicker from 'expo-document-picker'

/**
 * Types acceptés côté API (multer) — PDF, images courantes, texte.
 * @see services/documents.js ALLOWED_UPLOAD_MIMES
 */
const PICKER_TYPES: string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'text/plain'
]

export type PickedDocumentFile = {
  uri: string
  name: string
  mime: string
}

/**
 * Ouvre le sélecteur de fichiers (expo-document-picker) ; `null` si annulé.
 */
export async function pickDocumentFile(): Promise<PickedDocumentFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: PICKER_TYPES,
    copyToCacheDirectory: true
  })
  if (res.canceled || !res.assets?.[0]) {
    return null
  }
  const a = res.assets[0]
  return {
    uri: a.uri,
    name: a.name || 'document.pdf',
    mime: a.mimeType || 'application/pdf'
  }
}
