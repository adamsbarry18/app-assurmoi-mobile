import { useEffect, useRef, useState } from 'react'
import {
  prepareLocalDocumentPreview,
  removeLocalPreviewFile
} from '@/utils/documentPreview'
import type { PickedDocumentFile } from '@/utils/pickDocument'

/**
 * Télécharge le document (authentifié) en cache et expose un {@link PickedDocumentFile} pour
 * {@link PickedDocumentPreview} — ex. rechargement de l’écran assuré sans fichier local.
 */
export function useDocumentFileForPreview(
  documentId: number | null | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const [file, setFile] = useState<PickedDocumentFile | null>(null)
  const [loading, setLoading] = useState(false)
  const lastUri = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || documentId == null || documentId < 1) {
      setFile(null)
      setLoading(false)
      return
    }
    let cancelled = false
    if (lastUri.current) {
      removeLocalPreviewFile(lastUri.current)
      lastUri.current = null
    }
    setLoading(true)
    setFile(null)
    prepareLocalDocumentPreview(documentId)
      .then((p) => {
        if (cancelled) {
          removeLocalPreviewFile(p.localUri)
          return
        }
        lastUri.current = p.localUri
        const mime = p.contentType.split(';')[0].trim() || 'application/octet-stream'
        setFile({
          uri: p.localUri,
          name: `document-${documentId}`,
          mime
        })
      })
      .catch(() => {
        if (!cancelled) setFile(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [documentId, enabled])

  useEffect(() => {
    return () => {
      if (lastUri.current) {
        removeLocalPreviewFile(lastUri.current)
        lastUri.current = null
      }
    }
  }, [])

  return { file, loading }
}
