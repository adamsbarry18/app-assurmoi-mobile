import { useCallback, useState } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { ActivityIndicator, Menu, Text, useTheme } from 'react-native-paper'
import { BrandColors } from '@/constants/brand'
import {
  pickDocumentBySource,
  type MediaSource,
  type PickedDocumentFile
} from '@/utils/pickDocument'

type DocumentSourceFieldProps = {
  /** Action principale (ex. « Importer le fichier ») */
  label: string
  /** Aide optionnelle au-dessus de la ligne */
  description?: string
  /** Sous-texte (sources) */
  placeholder?: string
  busy?: boolean
  disabled?: boolean
  onPick: (file: PickedDocumentFile) => void | Promise<void>
}

const DEFAULT_PLACEHOLDER = 'Photo, galerie ou fichier'
const ROW_ICON = 24

/**
 * Ligne d’import compacte (réglages / apps bancaire) : un toucher ouvre
 * le menu appareil photo · photothèque · fichier.
 */
export function DocumentSourceField({
  label,
  description,
  placeholder = DEFAULT_PLACEHOLDER,
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
    <View style={styles.wrapper}>
      {description ? (
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6, lineHeight: 18 }}
        >
          {description}
        </Text>
      ) : null}
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint="Choisir la source : appareil photo, photothèque ou fichiers"
            onPress={() => {
              if (!disabled && !loading) {
                setMenuOpen(true)
              }
            }}
            disabled={disabled || loading}
            style={({ pressed }) => [
              styles.compactRow,
              {
                borderColor: theme.colors.outline,
                backgroundColor: pressed
                  ? theme.colors.surfaceVariant
                  : theme.colors.elevation?.level1 ?? theme.colors.surface
              },
              (disabled || loading) && { opacity: 0.5 }
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={BrandColors.primary} style={styles.leadIcon} />
            ) : (
              <MaterialCommunityIcons
                name="tray-arrow-up"
                size={ROW_ICON}
                color={disabled ? theme.colors.outline : BrandColors.primary}
                style={styles.leadIcon}
              />
            )}
            <View style={styles.textCol}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: theme.colors.onSurface
                }}
              >
                {label}
              </Text>
              <Text
                numberOfLines={1}
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 1 }}
              >
                {placeholder}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
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
          title="Photothèque"
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

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8
  },
  compactRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  leadIcon: {
    marginRight: 10
  },
  textCol: {
    flex: 1,
    minWidth: 0
  }
})
