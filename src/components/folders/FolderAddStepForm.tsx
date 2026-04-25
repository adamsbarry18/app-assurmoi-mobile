import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, HelperText, Menu, Surface, Text, TextInput, useTheme } from 'react-native-paper'
import { BrandColors } from '@/constants/brand'
import { DocumentSourceField } from '@/components/common/DocumentSourceField'
import { PickedDocumentPreview } from '@/components/common/PickedDocumentPreview'
import type { FolderDetailResponse } from '@/types/claims'
import type { PickedDocumentFile } from '@/utils/pickDocument'
import {
  labelLinkedDocumentTypeForStep,
  shouldShowAddStepDocumentIdField,
  shouldShowAddStepNoteField,
  type FolderStepLinkedDocumentApiType
} from '@/utils/claimFormat'

type AddStepDocRule =
  | { required: false }
  | { required: true; apiDocumentType: FolderStepLinkedDocumentApiType }

type FolderBody = FolderDetailResponse['data']

type StepOption = { value: string; label: string }
type DocTypeOption = { value: string; label: string }

type Props = {
  data: FolderBody
  stepType: string
  setStepType: (v: string) => void
  stepValue: string
  setStepValue: (v: string) => void
  stepDocId: string
  setStepDocId: (v: string) => void
  importDocType: string
  setImportDocType: (v: string) => void
  stepTypeMenu: boolean
  setStepTypeMenu: (v: boolean) => void
  importTypeMenu: boolean
  setImportTypeMenu: (v: boolean) => void
  addStepTypeOptions: StepOption[]
  addStepDocRule: AddStepDocRule
  docTypeOptions: DocTypeOption[]
  onSubmit: () => void
  onImportDocument: (file: PickedDocumentFile) => void
  actionBusy: boolean
  importBusy: boolean
  /** Aperçu local du dernier fichier choisi (avant / pendant envoi) */
  importPreview?: PickedDocumentFile | null
  /** Libellé optionnel (ex. numéro de document après upload) */
  importPreviewHint?: string | null
  onClearImportPreview?: () => void
}

/**
 * Formulaire « nouvelle étape » : sections hiérarchisées, un seul endroit pour le type de
 * document attendu, sélecteurs en ligne pleine largeur (UX proche des apps bancaires récentes).
 */
export function FolderAddStepForm({
  data,
  stepType,
  setStepType,
  stepValue,
  setStepValue,
  stepDocId,
  setStepDocId,
  importDocType,
  setImportDocType,
  stepTypeMenu,
  setStepTypeMenu,
  importTypeMenu,
  setImportTypeMenu,
  addStepTypeOptions,
  addStepDocRule,
  docTypeOptions,
  onSubmit,
  onImportDocument,
  actionBusy,
  importBusy,
  importPreview = null,
  importPreviewHint = null,
  onClearImportPreview
}: Props) {
  const theme = useTheme()
  const currentStepLabel =
    addStepTypeOptions.find((x) => x.value === stepType)?.label ?? stepType

  const docTypeHuman = useMemo(() => {
    if (addStepDocRule.required) {
      return labelLinkedDocumentTypeForStep(addStepDocRule.apiDocumentType)
    }
    return ''
  }, [addStepDocRule])

  const showImportTypePicker =
    data.scenario &&
    addStepDocRule.required &&
    docTypeOptions.length > 1

  const showNoteField = shouldShowAddStepNoteField(stepType)
  const showDocumentIdField = shouldShowAddStepDocumentIdField(
    addStepDocRule,
    Boolean(importPreview)
  )
  const showDetailsSection = showNoteField || showDocumentIdField

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}
      elevation={0}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.headerIcon,
            { backgroundColor: theme.colors.primaryContainer }
          ]}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={BrandColors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text variant="titleSmall" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
            Nouvelle étape
          </Text>
        </View>
      </View>

      {!data.scenario ? (
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.error, marginTop: 12, lineHeight: 20 }}
        >
          Définissez d’abord le scénario du dossier (onglet Aperçu), puis revenez ici.
        </Text>
      ) : null}

      {data.scenario ? (
        <>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}
          >
            Type d’étape
          </Text>
          <Menu
            visible={stepTypeMenu}
            onDismiss={() => setStepTypeMenu(false)}
            anchor={
              <Pressable
                onPress={() => setStepTypeMenu(true)}
                style={({ pressed }) => [
                  styles.selectRow,
                  {
                    borderColor: theme.colors.outline,
                    backgroundColor: pressed
                      ? theme.colors.surfaceVariant
                      : theme.colors.elevation?.level1 ?? theme.colors.background
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name="format-list-checks"
                  size={20}
                  color={BrandColors.primary}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    variant="bodyLarge"
                    numberOfLines={3}
                    style={{ fontWeight: '600', color: theme.colors.onSurface }}
                  >
                    {currentStepLabel}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            }
          >
            {addStepTypeOptions.map((o) => (
              <Menu.Item
                key={o.value}
                onPress={() => {
                  setStepType(o.value)
                  setStepTypeMenu(false)
                }}
                title={o.label}
              />
            ))}
          </Menu>
        </>
      ) : null}

      {data.scenario && addStepDocRule.required ? (
        <>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.onSurfaceVariant, marginTop: 12 }
            ]}
          >
            Fichier attendu
          </Text>
          <View
            style={[
              styles.hintPill,
              { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.outline }
            ]}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={18}
              color={BrandColors.primary}
              style={{ marginRight: 8 }}
            />
            <Text
              variant="bodySmall"
              numberOfLines={2}
              style={{ color: theme.colors.onSurface, flex: 1, lineHeight: 18, fontSize: 13 }}
            >
              {docTypeHuman}
            </Text>
          </View>
          {showImportTypePicker ? (
            <Menu
              visible={importTypeMenu}
              onDismiss={() => setImportTypeMenu(false)}
              anchor={
                <Pressable
                  onPress={() => setImportTypeMenu(true)}
                  style={({ pressed }) => [
                    styles.selectRow,
                    {
                      marginTop: 6,
                      borderColor: theme.colors.outline,
                      backgroundColor: pressed
                        ? theme.colors.surfaceVariant
                        : theme.colors.elevation?.level1 ?? theme.colors.background
                    }
                  ]}
                >
                  <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={1}>
                    Type de pièce : {docTypeOptions.find((o) => o.value === importDocType)?.label ?? importDocType}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={18}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
              }
            >
              {docTypeOptions.map((o) => (
                <Menu.Item
                  key={o.value}
                  onPress={() => {
                    setImportDocType(o.value)
                    setImportTypeMenu(false)
                  }}
                  title={o.label}
                />
              ))}
            </Menu>
          ) : null}
          <View style={styles.fileUploadGroup}>
            <DocumentSourceField
              label="Choisir un fichier"
              placeholder="Touchez pour photo, galerie ou PDF"
              busy={importBusy}
              disabled={importBusy || actionBusy}
              onPick={(f) => void onImportDocument(f)}
            />
            {importPreview ? (
              <PickedDocumentPreview
                file={importPreview}
                documentHint={importPreviewHint}
                busy={importBusy}
                onRemove={onClearImportPreview}
              />
            ) : null}
          </View>
        </>
      ) : null}

      {data.scenario && !addStepDocRule.required ? (
        <>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.onSurfaceVariant, marginTop: 12 }
            ]}
          >
            Fichier (optionnel)
          </Text>
          <HelperText type="info" padding="none" style={{ marginBottom: 8, marginTop: 0, fontSize: 12 }}>
            Rattachez un document seulement si l’étape l’impose.
          </HelperText>
          {docTypeOptions.length > 1 ? (
            <Menu
              visible={importTypeMenu}
              onDismiss={() => setImportTypeMenu(false)}
              anchor={
                <Pressable
                  onPress={() => setImportTypeMenu(true)}
                  style={({ pressed }) => [
                    styles.selectRow,
                    {
                      marginBottom: 4,
                      borderColor: theme.colors.outline,
                      backgroundColor: pressed
                        ? theme.colors.surfaceVariant
                        : theme.colors.elevation?.level1 ?? theme.colors.background
                    }
                  ]}
                >
                  <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                    {docTypeOptions.find((o) => o.value === importDocType)?.label ?? importDocType}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
              }
            >
              {docTypeOptions.map((o) => (
                <Menu.Item
                  key={o.value}
                  onPress={() => {
                    setImportDocType(o.value)
                    setImportTypeMenu(false)
                  }}
                  title={o.label}
                />
              ))}
            </Menu>
          ) : null}
          <View style={styles.fileUploadGroup}>
            <DocumentSourceField
              label="Choisir un fichier"
              placeholder="Touchez pour photo, galerie ou PDF"
              busy={importBusy}
              disabled={importBusy || actionBusy}
              onPick={(f) => void onImportDocument(f)}
            />
            {importPreview ? (
              <PickedDocumentPreview
                file={importPreview}
                documentHint={importPreviewHint}
                busy={importBusy}
                onRemove={onClearImportPreview}
              />
            ) : null}
          </View>
        </>
      ) : null}

      {data.scenario && showDetailsSection ? (
        <>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.onSurfaceVariant, marginTop: 12 }
            ]}
          >
            Détails
          </Text>
          {showNoteField ? (
            <TextInput
              label="Note (optionnel)"
              value={stepValue}
              onChangeText={setStepValue}
              mode="outlined"
              style={{ marginBottom: 2 }}
              dense
              multiline
              numberOfLines={2}
              placeholder="Réf. atelier, commentaire…"
            />
          ) : null}
          {showDocumentIdField ? (
            <>
              <TextInput
                label={
                  addStepDocRule.required
                    ? 'N° document'
                    : 'N° document (optionnel)'
                }
                value={stepDocId}
                onChangeText={setStepDocId}
                mode="outlined"
                keyboardType="number-pad"
                style={{ marginBottom: 0 }}
                dense
                placeholder="Souvent rempli par l’import"
              />
              {addStepDocRule.required ? (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, lineHeight: 16 }}
                >
                  Saisir le n° connu, ou laisser l’import l’inscrire.
                </Text>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {data.scenario ? (
        <Button
          mode="contained"
          buttonColor={BrandColors.primary}
          onPress={onSubmit}
          loading={actionBusy}
          disabled={actionBusy}
          style={{ marginTop: 12, borderRadius: 12 }}
          contentStyle={{ paddingVertical: 4 }}
        >
          Enregistrer l’étape
        </Button>
      ) : null}
    </Surface>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 12
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 0
  },
  /** Espace net entre le(s) sélecteur(s) et l’import de fichier, et sous le libellé d’aide. */
  fileUploadGroup: {
    marginTop: 12
  }
})
