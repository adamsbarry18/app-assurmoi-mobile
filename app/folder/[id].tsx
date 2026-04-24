import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router'
import { Button, Card, Divider, Menu, Text, TextInput, useTheme } from 'react-native-paper'
import { useAuth } from '@/features/auth'
import {
  assignFolderOfficer,
  closeFolder,
  fetchFolder,
  patchFolderScenario,
  postFolderRibStep,
  postFolderStep,
  uploadDocument
} from '@/lib/claimsApi'
import type { FolderDetailResponse, FolderStepRow, UserSummary } from '@/lib/claimsTypes'
import { ApiRequestError } from '@/lib/apiErrors'
import {
  API_DOCUMENT_UPLOAD_TYPES,
  FOLDER_STEP_TYPE_OPTIONS,
  folderStepLinkedDocumentRule,
  folderStepTypeOptionsForScenario,
  formatDate,
  labelFolderStatus,
  labelFolderStepType,
  labelLinkedDocumentTypeForStep,
  labelScenario
} from '@/lib/claimFormat'
import {
  canAssignFolderOfficer,
  canCloseFolder,
  canPostFolderStep,
  canSetFolderScenario,
  canViewEntityHistory,
  roleLabel
} from '@/lib/roleAccess'
import { fetchTrackingOfficerOptions } from '@/lib/usersApi'
import type { AuthUser } from '@/lib/auth/types'
import { BrandColors } from '@/constants/brand'
import { pickDocumentFile } from '@/lib/pickDocument'
import { buildDocumentMultipartForm } from '@/lib/documentFormData'

type FolderBody = FolderDetailResponse['data']

function hasRibStep(steps: FolderStepRow[] | undefined): boolean {
  return (steps ?? []).some((s) => s.step_type === 'S2_RIB')
}

function displayUser(
  u: AuthUser | UserSummary | NonNullable<FolderBody['assignedOfficer']>
): string {
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  if (n) return `${n} — ${u.email}`
  return u.email || u.username
}

export default function FolderDetailScreen() {
  const theme = useTheme()
  const router = useRouter()
  const navigation = useNavigation()
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const { user, isReady } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [ribError, setRibError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [title, setTitle] = useState('Dossier')
  const [uploading, setUploading] = useState(false)
  const [data, setData] = useState<FolderBody | null>(null)
  const [officerOptions, setOfficerOptions] = useState<AuthUser[]>([])
  const [officerMenu, setOfficerMenu] = useState(false)
  const [scenarioMenu, setScenarioMenu] = useState(false)
  const [stepTypeMenu, setStepTypeMenu] = useState(false)
  const [stepType, setStepType] = useState(FOLDER_STEP_TYPE_OPTIONS[0].value)
  const [stepValue, setStepValue] = useState('')
  const [stepDocId, setStepDocId] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [stepImportBusy, setStepImportBusy] = useState(false)
  const [importDocType, setImportDocType] = useState('EXPERT_REPORT')
  const [importTypeMenu, setImportTypeMenu] = useState(false)

  const id = Number.parseInt(String(rawId), 10)

  const load = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) {
      setError('Identifiant invalide')
      return
    }
    setError(null)
    setInfo(null)
    try {
      const res = await fetchFolder(id)
      setData(res.data)
      const ref = res.data.folder_reference
      setTitle(ref ? String(ref) : `Dossier #${id}`)
    } catch (e) {
      setData(null)
      setError(e instanceof ApiRequestError ? e.message : 'Chargement impossible.')
    }
  }, [id])

  const loadOfficerOptions = useCallback(async () => {
    if (!user || !canAssignFolderOfficer(user.role)) return
    try {
      const res = await fetchTrackingOfficerOptions({ limit: 120 })
      setOfficerOptions(res.data)
    } catch {
      setOfficerOptions([])
    }
  }, [user])

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  useEffect(() => {
    if (user) void load()
  }, [user, load])

  useEffect(() => {
    if (user && canAssignFolderOfficer(user.role)) void loadOfficerOptions()
  }, [user, loadOfficerOptions])

  useEffect(() => {
    if (!data?.scenario) return
    const allowed = folderStepTypeOptionsForScenario(data.scenario).map((o) => o.value)
    if (!allowed.includes(stepType)) {
      setStepType(allowed[0] ?? FOLDER_STEP_TYPE_OPTIONS[0].value)
    }
  }, [data?.scenario, stepType])

  useEffect(() => {
    if (!data?.scenario) return
    const rule = folderStepLinkedDocumentRule(stepType, data.scenario)
    if (rule.required) {
      setImportDocType(rule.apiDocumentType)
    }
  }, [data?.scenario, stepType])

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: BrandColors.primary
    })
  }, [navigation, title, theme.colors.surface])

  useLayoutEffect(() => {
    if (data?.folder_reference) {
      setTitle(String(data.folder_reference))
    }
  }, [data?.folder_reference])

  const onAssign = async (officerId: number) => {
    setOfficerMenu(false)
    if (!data) return
    setActionBusy(true)
    setError(null)
    try {
      const res = await assignFolderOfficer(data.id, officerId)
      setData(res.data)
      setInfo('Chargé de suivi affecté.')
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Affectation impossible.')
    } finally {
      setActionBusy(false)
    }
  }

  const onSetScenario = async (scenario: 'REPAIRABLE' | 'TOTAL_LOSS') => {
    setScenarioMenu(false)
    if (!data) return
    setActionBusy(true)
    setError(null)
    try {
      const res = await patchFolderScenario(data.id, scenario)
      setData(res.data)
      setInfo(
        'Scénario enregistré. Vous pouvez enchaîner avec les étapes (rapport, facture ou RIB selon le parcours).'
      )
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Impossible d’enregistrer le scénario (déjà défini ou règles métier).'
      )
    } finally {
      setActionBusy(false)
    }
  }

  const onCloseFolder = () => {
    if (!data) return
    Alert.alert(
      'Clôturer le dossier',
      'Confirmer la clôture ? Aucune nouvelle étape ne pourra être ajoutée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer',
          style: 'destructive',
          onPress: () => {
            setActionBusy(true)
            setError(null)
            void (async () => {
              try {
                const res = await closeFolder(data.id)
                setData(res.data)
                setInfo('Dossier clôturé.')
              } catch (e) {
                setError(e instanceof ApiRequestError ? e.message : 'Clôture impossible.')
              } finally {
                setActionBusy(false)
              }
            })()
          }
        }
      ]
    )
  }

  const onAddStep = async () => {
    if (!data) return
    setActionBusy(true)
    setError(null)
    try {
      const docRaw = stepDocId.trim()
      const document_id = docRaw === '' ? null : Number.parseInt(docRaw, 10)
      const linked = folderStepLinkedDocumentRule(stepType, data.scenario)
      if (linked.required && docRaw === '') {
        setError(
          `Cette étape exige l’identifiant d’un document déjà importé et validé (${labelLinkedDocumentTypeForStep(linked.apiDocumentType)}).`
        )
        return
      }
      if (docRaw !== '' && (Number.isNaN(document_id) || (document_id ?? 0) < 1)) {
        setError('Identifiant document invalide (nombre > 0) ou laissez vide.')
        return
      }
      await postFolderStep(data.id, {
        step_type: stepType,
        value: stepValue.trim() || null,
        document_id: document_id ?? null
      })
      setStepValue('')
      setStepDocId('')
      setInfo('Étape enregistrée.')
      await load()
    } catch (e) {
      setError(
        e instanceof ApiRequestError ? e.message : 'Étape refusée (règles métier / document).'
      )
    } finally {
      setActionBusy(false)
    }
  }

  const onImportWithSelectedType = useCallback(async () => {
    if (!data?.scenario) return
    setStepImportBusy(true)
    setError(null)
    setInfo(null)
    try {
      const picked = await pickDocumentFile()
      if (!picked) {
        return
      }
      const up = await uploadDocument(
        buildDocumentMultipartForm(importDocType, {
          uri: picked.uri,
          name: picked.name,
          mime: picked.mime
        })
      )
      setStepDocId(String(up.data.id))
      setInfo(
        `Document n°${up.data.id} importé (${importDocType}). Vérifiez la validation gestionnaire si requis, puis enregistrez l’étape.`
      )
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Import du document impossible.')
    } finally {
      setStepImportBusy(false)
    }
  }, [data?.scenario, importDocType])

  const onDepositRib = async () => {
    setRibError(null)
    if (!data || data.is_closed) return
    setUploading(true)
    try {
      const picked = await pickDocumentFile()
      if (!picked) {
        setUploading(false)
        return
      }
      const up = await uploadDocument(
        buildDocumentMultipartForm('RIB', {
          uri: picked.uri,
          name: picked.name,
          mime: picked.mime
        })
      )
      await postFolderRibStep(data.id, up.data.id)
      await load()
    } catch (e) {
      setRibError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Envoi du RIB échoué.'
      )
    } finally {
      setUploading(false)
    }
  }

  if (!user) return null

  const showRibCta =
    user.role === 'INSURED' &&
    data &&
    !data.is_closed &&
    data.scenario === 'TOTAL_LOSS' &&
    !hasRibStep(data.steps)

  const canDefineScenario =
    data &&
    user &&
    !data.scenario &&
    !data.is_closed &&
    canSetFolderScenario(user.role, data, user.id)

  const addStepTypeOptions = folderStepTypeOptionsForScenario(data?.scenario)
  const addStepDocRule = folderStepLinkedDocumentRule(stepType, data?.scenario)
  const addStepDocumentIdLabel = addStepDocRule.required
    ? `ID document (obligatoire) — ${labelLinkedDocumentTypeForStep(addStepDocRule.apiDocumentType)}`
    : 'ID document (optionnel)'

  const sinisterId = data?.sinister?.id ?? null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {error ? <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text> : null}
      {info ? <Text style={{ color: theme.colors.primary, marginBottom: 12 }}>{info}</Text> : null}

      {data ? (
        <>
          {sinisterId != null && user.role !== 'INSURED' ? (
            <Button
              mode="outlined"
              onPress={() => router.push(`/claim/${sinisterId}` as Href)}
              style={{ marginBottom: 12, borderColor: theme.colors.outline }}
            >
              Voir le sinistre
            </Button>
          ) : null}
          {canViewEntityHistory(user.role) && data ? (
            <Button
              mode="outlined"
              onPress={() =>
                router.push(`/history?entity_type=folder&entity_id=${data.id}` as Href)
              }
              style={{ marginBottom: 12, borderColor: theme.colors.outline }}
            >
              Historique du dossier
            </Button>
          ) : null}

          <Card style={{ marginBottom: 12 }} mode="outlined">
            <Card.Content>
              <Text variant="bodyLarge" style={{ fontWeight: '600', marginBottom: 6 }}>
                {labelFolderStatus(data.status)}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {labelScenario(data.scenario)}
              </Text>
            </Card.Content>
          </Card>

          {canDefineScenario ? (
            <Card style={{ marginBottom: 12, borderColor: BrandColors.primary }} mode="outlined">
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 6 }}>
                  Définir le scénario du dossier
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10, lineHeight: 20 }}
                >
                  Avant d’ajouter des étapes structurées (ex. rapport d’expertise, facture, RIB), le
                  dossier doit être <Text style={{ fontWeight: '600' }}>réparable</Text> ou en{' '}
                  <Text style={{ fontWeight: '600' }}>perte totale</Text>.
                </Text>
                <Menu
                  visible={scenarioMenu}
                  onDismiss={() => setScenarioMenu(false)}
                  anchor={
                    <Button
                      mode="contained"
                      buttonColor={BrandColors.primary}
                      onPress={() => setScenarioMenu(true)}
                      loading={actionBusy}
                      disabled={actionBusy}
                    >
                      Choisir REPAIRABLE ou TOTAL_LOSS
                    </Button>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      void onSetScenario('REPAIRABLE')
                    }}
                    title="Véhicule réparable (REPAIRABLE)"
                  />
                  <Menu.Item
                    onPress={() => {
                      void onSetScenario('TOTAL_LOSS')
                    }}
                    title="Perte totale (TOTAL_LOSS)"
                  />
                </Menu>
              </Card.Content>
            </Card>
          ) : null}

          {data.assignedOfficer ? (
            <Card style={{ marginBottom: 12 }} mode="outlined">
              <Card.Content>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                >
                  Chargé de suivi
                </Text>
                <Text variant="bodyMedium">{displayUser(data.assignedOfficer)}</Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                >
                  {roleLabel(data.assignedOfficer.role)}
                </Text>
              </Card.Content>
            </Card>
          ) : canAssignFolderOfficer(user.role) && !data.is_closed ? (
            <Card style={{ marginBottom: 12 }} mode="outlined">
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>
                  Affecter un chargé de suivi
                </Text>
                <Menu
                  visible={officerMenu}
                  onDismiss={() => setOfficerMenu(false)}
                  anchor={
                    <Button
                      mode="contained"
                      buttonColor={BrandColors.primary}
                      onPress={() => setOfficerMenu(true)}
                      loading={actionBusy}
                      disabled={actionBusy}
                    >
                      Choisir un responsable
                    </Button>
                  }
                >
                  {officerOptions.map((o) => (
                    <Menu.Item key={o.id} onPress={() => onAssign(o.id)} title={displayUser(o)} />
                  ))}
                </Menu>
              </Card.Content>
            </Card>
          ) : null}

          {canCloseFolder(user.role) && !data.is_closed ? (
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              onPress={onCloseFolder}
              disabled={actionBusy}
              style={{ marginBottom: 12 }}
            >
              Clôturer le dossier
            </Button>
          ) : null}

          {showRibCta ? (
            <Card style={{ marginBottom: 16, borderColor: BrandColors.primary }} mode="outlined">
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 6 }}>
                  Déposer votre RIB
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12, lineHeight: 20 }}
                >
                  Ce dossier est en perte totale. Importez un PDF ou une image de votre RIB ; il
                  sera lié à l’étape (validation gestionnaire côté back-office).
                </Text>
                {ribError ? (
                  <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{ribError}</Text>
                ) : null}
                <Button
                  mode="contained"
                  buttonColor={BrandColors.primary}
                  onPress={onDepositRib}
                  loading={uploading}
                  disabled={uploading}
                >
                  Choisir un fichier et envoyer
                </Button>
              </Card.Content>
            </Card>
          ) : null}

          {user && canPostFolderStep(user.role, data, user.id) && user.role !== 'INSURED' ? (
            <Card style={{ marginBottom: 16 }} mode="outlined">
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>
                  Ajouter une étape
                </Text>
                {!data.scenario ? (
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.error, marginBottom: 8, lineHeight: 20 }}
                  >
                    Enregistrez d’abord le scénario du dossier (bloc ci-dessus) pour utiliser les
                    étapes pilotées (rapport, facture, RIB).
                  </Text>
                ) : null}
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, lineHeight: 20 }}
                >
                  {addStepDocRule.required ? (
                    <>
                      L’étape choisie exige un identifiant de document : le type requis est rappelé
                      ci-dessous (préselectionné pour l’import). Sinon l’id reste optionnel.
                    </>
                  ) : (
                    <>
                      L’id document est <Text style={{ fontWeight: '600' }}>optionnel</Text> pour
                      ce type d’étape (ex. échéance). Utilisez le bloc import pour générer un id, ou
                      laissez vide.
                    </>
                  )}
                </Text>
                {addStepDocRule.required ? (
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.primary, marginBottom: 8, lineHeight: 20 }}
                  >
                    Type attendu : {labelLinkedDocumentTypeForStep(addStepDocRule.apiDocumentType)}
                  </Text>
                ) : null}
                {data.scenario ? (
                  <>
                    <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 4 }}>
                      Importer un document
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, lineHeight: 20 }}
                    >
                      Type côté API, puis choix d’un PDF ou d’une image. Le champ id plus bas se
                      remplit automatiquement.
                    </Text>
                    <Menu
                      visible={importTypeMenu}
                      onDismiss={() => setImportTypeMenu(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setImportTypeMenu(true)}
                          style={{ marginBottom: 8 }}
                        >
                          {API_DOCUMENT_UPLOAD_TYPES.find((o) => o.value === importDocType)?.label ??
                            importDocType}
                        </Button>
                      }
                    >
                      {API_DOCUMENT_UPLOAD_TYPES.map((o) => (
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
                    <Button
                      mode="outlined"
                      onPress={() => void onImportWithSelectedType()}
                      loading={stepImportBusy}
                      disabled={stepImportBusy || actionBusy}
                      style={{ marginBottom: 12 }}
                    >
                      Importer le fichier
                    </Button>
                  </>
                ) : null}
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 6 }}>
                  Type d’étape
                </Text>
                <Menu
                  visible={stepTypeMenu}
                  onDismiss={() => setStepTypeMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setStepTypeMenu(true)}
                      style={{ marginBottom: 8 }}
                    >
                      {addStepTypeOptions.find((x) => x.value === stepType)?.label ?? stepType}
                    </Button>
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
                <TextInput
                  label="Valeur / note (optionnel)"
                  value={stepValue}
                  onChangeText={setStepValue}
                  mode="outlined"
                  style={{ marginBottom: 8 }}
                  multiline
                />
                <TextInput
                  label={addStepDocumentIdLabel}
                  value={stepDocId}
                  onChangeText={setStepDocId}
                  mode="outlined"
                  keyboardType="number-pad"
                  style={{ marginBottom: 8 }}
                />
                <Button
                  mode="contained"
                  buttonColor={BrandColors.primary}
                  onPress={onAddStep}
                  loading={actionBusy}
                  disabled={actionBusy || !data.scenario}
                >
                  Enregistrer l’étape
                </Button>
              </Card.Content>
            </Card>
          ) : null}

          <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>
            Étapes
          </Text>
          {(data.steps ?? []).length === 0 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Aucune étape enregistrée.
            </Text>
          ) : (
            (data.steps ?? []).map((s, i) => (
              <View key={s.id}>
                {i > 0 ? <Divider style={{ marginVertical: 8 }} /> : null}
                <View>
                  <Text variant="labelLarge" style={{ color: BrandColors.primary }}>
                    {labelFolderStepType(s.step_type ?? undefined)}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                  >
                    {formatDate(s.action_date)}
                  </Text>
                  {s.performedBy ? (
                    <Text
                      variant="labelSmall"
                      style={{ marginTop: 4, color: theme.colors.outline }}
                    >
                      Par {displayUser(s.performedBy)}
                    </Text>
                  ) : null}
                  {s.value ? (
                    <Text variant="bodySmall" style={{ marginTop: 4 }}>
                      {s.value}
                    </Text>
                  ) : null}
                  {s.document_id != null || s.document != null ? (
                    <Pressable
                      onPress={() => {
                        const did = s.document_id ?? s.document?.id
                        if (did != null) {
                          router.push(`/document/${did}` as Href)
                        }
                      }}
                      style={{ marginTop: 6 }}
                    >
                      <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                        Document
                        {s.document?.is_validated === false ? ' (à valider)' : ''} — n°
                        {s.document_id ?? s.document?.id}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </>
      ) : !error ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Chargement…
        </Text>
      ) : null}
    </ScrollView>
  )
}
