import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Alert, Platform } from 'react-native'

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

function alertPermission(msg: string): void {
  Alert.alert('Autorisation requise', msg)
}

/**
 * Photo via l’appareil photo (image uniquement).
 */
export async function pickImageFromCamera(): Promise<PickedDocumentFile | null> {
  if (Platform.OS === 'web') {
    alertPermission('La prise de photo n’est pas disponible sur le web : utilisez la photothèque ou un fichier.')
    return null
  }
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    alertPermission(
      "L'accès à la caméra est nécessaire pour photographier un document. Vous pouvez activer l'autorisation dans les réglages de l'appareil."
    )
    return null
  }
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: 'images' as ImagePicker.MediaType,
    quality: 0.88
  })
  if (res.canceled || !res.assets?.[0]) {
    return null
  }
  const a = res.assets[0]
  const name = a.fileName ?? `photo_${Date.now()}.jpg`
  return {
    uri: a.uri,
    name,
    mime: a.mimeType ?? 'image/jpeg'
  }
}

/**
 * Image ou capture depuis la photothèque (galerie).
 */
export async function pickImageFromLibrary(): Promise<PickedDocumentFile | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    alertPermission(
      "L'accès aux photos est nécessaire pour choisir une image. Vous pouvez activer l'autorisation dans les réglages de l'appareil."
    )
    return null
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images' as ImagePicker.MediaType,
    quality: 0.9,
    allowsMultipleSelection: false
  })
  if (res.canceled || !res.assets?.[0]) {
    return null
  }
  const a = res.assets[0]
  const name = a.fileName ?? `image_${Date.now()}.jpg`
  return {
    uri: a.uri,
    name,
    mime: a.mimeType ?? 'image/jpeg'
  }
}

export type MediaSource = 'camera' | 'library' | 'file'

/**
 * Demande un fichier selon la source (caméra, galerie, explorateur de fichiers).
 */
export async function pickDocumentBySource(source: MediaSource): Promise<PickedDocumentFile | null> {
  switch (source) {
    case 'camera':
      return pickImageFromCamera()
    case 'library':
      return pickImageFromLibrary()
    case 'file':
      return pickDocumentFile()
    default:
      return null
  }
}
