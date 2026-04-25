import { Pressable, View } from 'react-native'
import { ActivityIndicator, Text, useTheme } from 'react-native-paper'
import { useRouter, type Href } from 'expo-router'
import { PickedDocumentPreview } from '@/components/common/PickedDocumentPreview'
import { DocumentSourceField } from '@/components/common/DocumentSourceField'
import { useDocumentFileForPreview } from '@/hooks/useDocumentFileForPreview'
import type { PickedDocumentFile } from '@/utils/pickDocument'
import { BrandColors } from '@/constants/brand'

type Props = {
  title: string
  documentId: number | null
  /** Fichier choisi, pas encore envoyé (voir bouton en bas d’écran) */
  stagedFile: PickedDocumentFile | null
  /** `null` = statut inconnu (masquer la ligne) */
  isValidated: boolean | null
  showPicker: boolean
  /** Import en cours pour cette ligne seulement */
  busy: boolean
  anyBusy: boolean
  onPick: (f: PickedDocumentFile) => void
  /** Détache la pièce du sinistre (même rôle que l’import : ex. assuré avant validation) */
  onRemove?: () => void
}

const PLACEHOLDER = 'Photo, galerie ou fichier'

/**
 * CNI / carte grise / attestation : sélection (brouillon) + aperçu, ou pièce déjà enregistrée côté API.
 */
export function InsuredObligatoryDocRow ({
  title,
  documentId,
  stagedFile,
  isValidated,
  showPicker,
  busy,
  anyBusy,
  onPick,
  onRemove
}: Props) {
  const theme = useTheme()
  const router = useRouter()
  const documentHref =
    documentId != null ? (`/document/${documentId}` as Href) : null
  const loadFromApi = !stagedFile && documentId != null
  const { file: serverFile, loading: serverLoading } = useDocumentFileForPreview(
    loadFromApi ? documentId : null,
    { enabled: loadFromApi }
  )
  const displayFile = stagedFile ?? serverFile
  const showPreviewLoading = loadFromApi && serverLoading
  const showOfflineLink =
    documentId != null &&
    !displayFile &&
    !showPreviewLoading &&
    loadFromApi &&
    !serverLoading
  const previewHint = stagedFile
    ? documentId != null
      ? 'Brouillon — remplacera le document lié à l’envoi'
      : 'Brouillon — confirmer l’envoi en bas d’écran'
    : documentId != null
      ? `N° document ${documentId}`
      : null

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: 6 }}
      >
        {title}
      </Text>

      {showPreviewLoading ? (
        <View
          style={{
            paddingVertical: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.outlineVariant,
            backgroundColor: theme.colors.surfaceVariant,
            marginBottom: 8
          }}
        >
          <ActivityIndicator color={BrandColors.primary} />
          <Text variant="labelSmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
            Chargement de l’aperçu…
          </Text>
        </View>
      ) : null}

      {displayFile && !showPreviewLoading ? (
        <View style={{ marginBottom: 8 }}>
          <PickedDocumentPreview
            file={displayFile}
            documentHint={previewHint}
            busy={busy}
            onRemove={onRemove}
          />
          {!stagedFile && isValidated != null ? (
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, marginLeft: 2 }}
            >
              {isValidated ? 'Validé' : 'En attente de contrôle par un gestionnaire'}
            </Text>
          ) : null}
          {!stagedFile && documentHref ? (
            <Pressable
              onPress={() => router.push(documentHref)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginTop: 4 })}
              accessibilityRole="link"
              accessibilityLabel="Ouvrir la fiche document"
            >
              <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                Fiche et validation
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showOfflineLink && documentHref ? (
        <Pressable
          onPress={() => router.push(documentHref)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, marginBottom: 8 })}
        >
          <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
            Document n°{documentId} — ouvrir la fiche (aperçu indisponible)
          </Text>
        </Pressable>
      ) : null}

      {showPicker ? (
        <DocumentSourceField
          label={stagedFile != null || documentId != null ? 'Changer le fichier' : 'Choisir un fichier'}
          description={undefined}
          placeholder={PLACEHOLDER}
          busy={busy}
          disabled={anyBusy}
          onPick={onPick}
        />
      ) : null}
    </View>
  )
}
