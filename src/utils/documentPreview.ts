import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import { EncodingType } from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Sharing from 'expo-sharing'
import { apiFetchBinaryWithAuth } from '@/api/client'

const MAX_PDF_DATA_URL_BYTES = 2_200_000
const MAX_PLAIN_TEXT_PREVIEW = 200_000

export function extFromContentType(ct: string): string {
  const c = ct.toLowerCase()
  if (c.includes('pdf')) return 'pdf'
  if (c.includes('jpeg') || c.includes('jpg')) return 'jpg'
  if (c.includes('png')) return 'png'
  if (c.includes('gif')) return 'gif'
  if (c.includes('webp')) return 'webp'
  if (c.includes('text/plain')) return 'txt'
  return 'bin'
}

export function isImageContentType(ct: string): boolean {
  return ct.toLowerCase().startsWith('image/')
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const len = bytes.byteLength
  const chunkSize = 0x8000
  for (let i = 0; i < len; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, len))
    binary += String.fromCharCode(...sub)
  }
  return btoa(binary)
}

export type PreparedPreview = {
  localUri: string
  contentType: string
  size: number
  textSample?: string
  pdfDataUrl?: string
}

/**
 * Télécharge le binaire (auth) et écrit en cache ; pour les petits PDF, prépare un data URL
 * optionnel pour WebView.
 */
export async function prepareLocalDocumentPreview(documentId: number): Promise<PreparedPreview> {
  const { arrayBuffer, contentType } = await apiFetchBinaryWithAuth(`/api/documents/${documentId}`)
  const base = FileSystem.cacheDirectory
  if (!base) {
    throw new Error("Répertoire de cache indisponible sur l'appareil.")
  }
  const ext = extFromContentType(contentType)
  const localUri = `${base}doc-preview-${documentId}-${Date.now()}.${ext}`
  const b64 = arrayBufferToBase64(arrayBuffer)
  await FileSystem.writeAsStringAsync(localUri, b64, {
    encoding: EncodingType.Base64
  })

  const size = arrayBuffer.byteLength
  const lower = contentType.toLowerCase()
  let textSample: string | undefined
  if (lower.includes('text/plain')) {
    const full = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer)
    textSample =
      full.length > MAX_PLAIN_TEXT_PREVIEW ? full.slice(0, MAX_PLAIN_TEXT_PREVIEW) + '\n…' : full
  }

  let pdfDataUrl: string | undefined
  if (lower.includes('application/pdf') && size <= MAX_PDF_DATA_URL_BYTES) {
    pdfDataUrl = `data:application/pdf;base64,${b64}`
  }

  return { localUri, contentType, size, textSample, pdfDataUrl }
}

/**
 * Tente d’ouvrir le fichier avec une application du système (lecteur PDF, etc.).
 * Sur iOS, si aucune appli n’est proposée directement, le partage système sert d’alternative.
 */
export async function openInExternalViewer(localUri: string, contentType: string): Promise<void> {
  const mime = contentType || 'application/octet-stream'
  if (Platform.OS === 'android') {
    const contentUri = await FileSystem.getContentUriAsync(localUri)
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: mime
      })
    } catch {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri, { mimeType: mime, dialogTitle: 'Ouvrir le document' })
      } else {
        throw new Error('Aucune application pour ouvrir ce type de fichier.')
      }
    }
  } else if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri, {
      mimeType: mime,
      UTI: mapMimeToUti(mime)
    })
  } else {
    throw new Error('Partage indisponible sur cet appareil.')
  }
}

function mapMimeToUti(mime: string): string {
  const m = mime.toLowerCase()
  if (m === 'application/pdf') return 'com.adobe.pdf'
  if (m.startsWith('image/jpeg')) return 'public.jpeg'
  if (m.startsWith('image/png')) return 'public.png'
  return 'public.data'
}

export function removeLocalPreviewFile(localUri: string | null | undefined) {
  if (!localUri) return
  void FileSystem.deleteAsync(localUri, { idempotent: true })
}
