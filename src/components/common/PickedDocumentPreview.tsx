import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View
} from 'react-native'
import { Image } from 'expo-image'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, IconButton, Text, useTheme } from 'react-native-paper'
import { WebView } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BrandColors } from '@/constants/brand'
import type { PickedDocumentFile } from '@/utils/pickDocument'
import { canPreviewInApp, isImageMime, isPdfMime, shortFileName } from '@/utils/documentMime'

type PickedDocumentPreviewProps = {
  file: PickedDocumentFile
  documentHint?: string | null
  busy?: boolean
  onRemove?: () => void
}

/**
 * Pièce importée : une seule rangée (miniature + nom), toucher la zone = aperçu, × = retirer.
 */
export function PickedDocumentPreview ({
  file,
  documentHint,
  busy = false,
  onRemove
}: PickedDocumentPreviewProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const [modal, setModal] = useState<'off' | 'image' | 'pdf'>('off')

  const isImg = isImageMime(file.mime, file.name)
  const isPdf = isPdfMime(file.mime, file.name)
  const canOpen = (isImg || (isPdf && Platform.OS !== 'web')) && canPreviewInApp(file)
  const closeModal = useCallback(() => setModal('off'), [])

  const openPreview = useCallback(() => {
    if (busy) return
    if (isImg) {
      setModal('image')
      return
    }
    if (isPdf) {
      if (Platform.OS === 'web') {
        Alert.alert('Aperçu', 'Sur le web, enregistrez le fichier et ouvrez-le depuis votre appareil.')
        return
      }
      setModal('pdf')
      return
    }
    Alert.alert('Aperçu', 'Impossible d’afficher ce format dans l’app.')
  }, [busy, isImg, isPdf])

  return (
    <>
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderColor: theme.colors.outlineVariant
          }
        ]}
      >
        <Pressable
          onPress={canOpen && !busy ? openPreview : undefined}
          disabled={busy || !canOpen}
          style={({ pressed }) => [
            styles.rowMain,
            { opacity: pressed && canOpen && !busy ? 0.88 : 1 }
          ]}
        >
          {isImg ? (
            <View style={styles.thumbBox}>
              <Image
                source={{ uri: file.uri }}
                style={styles.thumb}
                contentFit="cover"
                transition={100}
              />
            </View>
          ) : (
            <View
              style={[
                styles.thumbBox,
                styles.iconBox,
                { backgroundColor: theme.colors.primaryContainer }
              ]}
            >
              <MaterialCommunityIcons
                name={isPdf ? 'file-pdf-box' : 'file-document-outline'}
                size={24}
                color={BrandColors.primary}
              />
            </View>
          )}

          <View style={styles.middle}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 15, fontWeight: '600', color: theme.colors.onSurface }}
            >
              {shortFileName(file.name, 30)}
            </Text>
            <Text
              numberOfLines={1}
              style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 }}
            >
              {busy
                ? 'Envoi en cours'
                : [
                    documentHint,
                    canOpen ? 'Toucher pour voir' : null,
                    !canOpen && !documentHint ? 'Aperçu indisponible' : null
                  ]
                    .filter(Boolean)
                    .join(' · ')}
            </Text>
          </View>

          {busy ? (
            <ActivityIndicator size="small" color={BrandColors.primary} />
          ) : canOpen ? (
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          ) : null}
        </Pressable>

        {onRemove && !busy ? (
          <IconButton
            icon="close"
            size={20}
            onPress={onRemove}
            style={styles.removeBtn}
            accessibilityLabel="Retirer le fichier"
          />
        ) : null}
      </View>

      <Modal
        visible={modal === 'image'}
        animationType="fade"
        onRequestClose={closeModal}
        statusBarTranslucent
        presentationStyle="fullScreen"
      >
        <View style={[styles.viewerBase, { paddingTop: insets.top }]}>
          <View style={styles.viewerTopBar}>
            <Text
              numberOfLines={1}
              style={styles.viewerFileName}
            >
              {shortFileName(file.name, 36)}
            </Text>
            <IconButton
              icon="close"
              iconColor="#fff"
              size={24}
              onPress={closeModal}
              containerColor="rgba(255,255,255,0.18)"
              accessibilityLabel="Fermer l’aperçu"
            />
          </View>
          <ScrollView
            bounces
            contentContainerStyle={[
              styles.viewerImageScroll,
              { paddingBottom: insets.bottom + 16, minHeight: height * 0.65 }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={{ uri: file.uri }}
              style={{ width: width - 24, minHeight: height * 0.5 }}
              contentFit="contain"
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={modal === 'pdf'}
        animationType="slide"
        onRequestClose={closeModal}
        presentationStyle="pageSheet"
        statusBarTranslucent
      >
        <View style={[styles.pdfRoot, { paddingTop: insets.top }]}>
          <View
            style={[
              styles.pdfBar,
              { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }
            ]}
          >
            <Text
              numberOfLines={1}
              style={{ flex: 1, fontSize: 16, fontWeight: '600', color: theme.colors.onSurface }}
            >
              {shortFileName(file.name, 40)}
            </Text>
            <Button mode="text" onPress={closeModal} textColor={BrandColors.primary}>
              Fermer
            </Button>
          </View>
          {Platform.OS !== 'web' ? (
            <WebView
              source={{ uri: file.uri }}
              style={{ flex: 1, backgroundColor: theme.colors.background }}
              originWhitelist={['*']}
              allowFileAccess
              allowFileAccessFromFileURLs
              allowUniversalAccessFromFileURLs
            />
          ) : null}
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 64
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 4,
    minWidth: 0
  },
  removeBtn: {
    margin: 0
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden'
  },
  thumb: {
    width: 48,
    height: 48
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  middle: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10
  },
  viewerBase: {
    flex: 1,
    backgroundColor: '#0c0c0c'
  },
  viewerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8
  },
  viewerFileName: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '600',
    flex: 1
  },
  viewerImageScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pdfRoot: {
    flex: 1,
    backgroundColor: '#f6f6f6'
  },
  pdfBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth
  }
})
