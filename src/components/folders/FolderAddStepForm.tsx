import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, HelperText, Menu, Surface, Text, TextInput, useTheme } from 'react-native-paper'
import { BrandColors } from '@/constants/brand'
import { DocumentSourceField } from '@/components/common/DocumentSourceField'
import type { FolderDetailResponse } from '@/types/claims'
import type { PickedDocumentFile } from '@/utils/pickDocument'
import {
  labelLinkedDocumentTypeForStep,
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
  importBusy
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
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color={BrandColors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
            Nouvelle étape
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            Renseignez l’action, un fichier si nécessaire, puis enregistrez.
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
          <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
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
                  size={22}
                  color={BrandColors.primary}
                  style={{ marginRight: 12 }}
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
                  size={22}
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
              { color: theme.colors.onSurfaceVariant, marginTop: 20 }
            ]}
          >
            Justificatif
          </Text>
          <View
            style={[
              styles.hintPill,
              { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.outline }
            ]}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={20}
              color={BrandColors.primary}
              style={{ marginRight: 10 }}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurface, flex: 1, lineHeight: 20 }}>
              Fichier attendu : {docTypeHuman}
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
                      marginTop: 8,
                      borderColor: theme.colors.outline,
                      backgroundColor: pressed
                        ? theme.colors.surfaceVariant
                        : theme.colors.elevation?.level1 ?? theme.colors.background
                    }
                  ]}
                >
                  <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                    Type d’enregistrement :{' '}
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
          <View style={{ marginTop: 8 }}>
            <DocumentSourceField
              label="Déposer le fichier"
              placeholder="Photo, galerie ou fichier…"
              busy={importBusy}
              disabled={importBusy || actionBusy}
              onPick={(f) => void onImportDocument(f)}
            />
          </View>
        </>
      ) : null}

      {data.scenario && !addStepDocRule.required ? (
        <>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.onSurfaceVariant, marginTop: 20 }
            ]}
          >
            Fichier (optionnel)
          </Text>
          <HelperText type="info" padding="none" style={{ marginBottom: 8, marginTop: 0 }}>
            Import seulement si un document doit être rattaché à l’étape.
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
          <DocumentSourceField
            label="Déposer un fichier"
            placeholder="Photo, galerie ou fichier…"
            busy={importBusy}
            disabled={importBusy || actionBusy}
            onPick={(f) => void onImportDocument(f)}
          />
        </>
      ) : null}

      {data.scenario ? (
        <>
          <Text
            style={[
              styles.sectionLabel,
              { color: theme.colors.onSurfaceVariant, marginTop: 20 }
            ]}
          >
            Détails
          </Text>
          <TextInput
            label="Note (optionnel)"
            value={stepValue}
            onChangeText={setStepValue}
            mode="outlined"
            style={{ marginBottom: 4 }}
            multiline
            numberOfLines={2}
            placeholder="Ex. ref. atelier, commentaire…"
          />
          <TextInput
            label={
              addStepDocRule.required
                ? 'N° document (souvent rempli après import)'
                : 'N° document (optionnel)'
            }
            value={stepDocId}
            onChangeText={setStepDocId}
            mode="outlined"
            keyboardType="number-pad"
            style={{ marginBottom: 4 }}
            placeholder="Ex. 12345"
          />
          {addStepDocRule.required ? (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, marginBottom: 4 }}>
              Obligatoire si l’étape exige un justificatif déjà connu côté système. Sinon laissez
              l’import le renseigner.
            </Text>
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
          style={{ marginTop: 20, borderRadius: 12 }}
          contentStyle={{ paddingVertical: 6 }}
        >
          Enregistrer l’étape
        </Button>
      ) : null}
    </Surface>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 16
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 2
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 0
  }
})
