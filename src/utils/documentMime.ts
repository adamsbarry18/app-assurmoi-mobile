import type { PickedDocumentFile } from './pickDocument'

export function isImageMime (mime: string, name: string): boolean {
  const m = (mime || '').toLowerCase()
  if (m.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(name)
}

export function isPdfMime (mime: string, name: string): boolean {
  return (mime || '').toLowerCase() === 'application/pdf' || /\.pdf$/i.test(name)
}

export function canPreviewInApp (file: PickedDocumentFile): boolean {
  return isImageMime(file.mime, file.name) || isPdfMime(file.mime, file.name)
}

export function shortFileName (name: string, max = 40): string {
  if (name.length <= max) return name
  return `${name.slice(0, max - 1)}…`
}
