import { useCallback, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { ActivityIndicator, Menu, Text, TextInput, useTheme } from 'react-native-paper'
import {
  pickDocumentBySource,
  type MediaSource,
  type PickedDocumentFile
} from '@/utils/pickDocument'

type DocumentSourceFieldProps = {
  /** Libellé du champ (Material) */
  label: string
  /** Texte d’aide sous le titre de section (optionnel) */
  description?: string
  /** Rappel dans le champ vide */
  placeholder?: string
  busy?: boolean
  disabled?: boolean
  /** Après sélection d’une source et d’un fichier ; peut être async (upload). */
  onPick: (file: PickedDocumentFile) => void | Promise<void>
}

/**
 * Champ type « outline » : au toucher, menu **Prendre une photo** | **Photothèque** | **Fichier** (PDF, etc.).
 * La caméra est masquée sur le web.
 */
export function DocumentSourceField({
  label,
  description,
  placeholder = 'Appuyer pour choisir : photo, galerie ou fichier…',
  busy = false,
  disabled = false,
  onPick
}: DocumentSourceFieldProps) {
  const theme = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [picking, setPicking] = useState(false)

  const runSource = useCallback(
    async (source: MediaSource) => {
      setMenuOpen(false)
      setPicking(true)
      try {
        const file = await pickDocumentBySource(source)
        if (file) {
          await Promise.resolve(onPick(file))
        }
      } finally {
        setPicking(false)
      }
    },
    [onPick]
  )

  const loading = busy || picking
  const showCamera = Platform.OS !== 'web'

  return (
    <View style={{ marginBottom: 12 }}>
      {description ? (
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, lineHeight: 20 }}
        >
          {description}
        </Text>
      ) : null}
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <Pressable
            onPress={() => {
              if (!disabled && !loading) {
                setMenuOpen(true)
              }
            }}
            disabled={disabled || loading}
          >
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label={label}
                value=""
                placeholder={placeholder}
                editable={false}
                right={
                  loading ? (
                    <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
                  ) : (
                    <TextInput.Icon icon="menu-down" />
                  )
                }
              />
            </View>
          </Pressable>
        }
      >
        {showCamera ? (
          <Menu.Item
            leadingIcon="camera"
            onPress={() => void runSource('camera')}
            title="Prendre une photo"
          />
        ) : null}
        <Menu.Item
          leadingIcon="image-multiple"
          onPress={() => void runSource('library')}
          title="Bibliothèque photos"
        />
        <Menu.Item
          leadingIcon="file-document-outline"
          onPress={() => void runSource('file')}
          title="Fichier (PDF, image…)"
        />
      </Menu>
    </View>
  )
}
