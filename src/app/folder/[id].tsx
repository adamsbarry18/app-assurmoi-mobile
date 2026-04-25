import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router'
import {
  Button,
  Card,
  Chip,
  HelperText,
  Menu,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper'
import { useAuth } from '@/auth'
import {
  ApiRequestError,
  assignFolderOfficer,
  closeFolder,
  fetchFolder,
  fetchTrackingOfficerOptions,
  patchFolderScenario,
  postFolderRibStep,
  postFolderStep,
  uploadDocument
} from '@/api'
import type { FolderDetailResponse, FolderStepRow, UserSummary } from '@/types/claims'
import {
  apiDocumentUploadTypesForRole,
  FOLDER_STEP_TYPE_OPTIONS,
  folderStepLinkedDocumentRule,
  folderStepTypeOptionsForScenario,
  labelFolderStatus,
  labelLinkedDocumentTypeForStep,
  labelScenario
} from '@/utils/claimFormat'
import {
  canAssignFolderOfficer,
  canCloseFolder,
  canPostFolderStep,
  canSetFolderScenario,
  canViewEntityHistory,
  roleLabel
} from '@/utils/roleAccess'
import type { AuthUser } from '@/auth/types'
import { BrandColors } from '@/constants/brand'
import { DocumentSourceField } from '@/components/common/DocumentSourceField'
import { FolderStepTimeline } from '@/components/folders/FolderStepTimeline'
import type { PickedDocumentFile } from '@/utils/pickDocument'
import { buildDocumentMultipartForm } from '@/utils/documentFormData'

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
  const [insuredExtraType, setInsuredExtraType] = useState('RIB')
  const [insuredExtraMenu, setInsuredExtraMenu] = useState(false)
  const [insuredExtraBusy, setInsuredExtraBusy] = useState(false)
  const [mainTab, setMainTab] = useState<'apercu' | 'mid' | 'parcours'>('apercu')

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

  const showMidTab = useMemo(() => {
    if (!data || !user) return false
    if (user.role === 'INSURED' && !data.is_closed) return true
    return canPostFolderStep(user.role, data, user.id) && user.role !== 'INSURED'
  }, [data, user])

  useEffect(() => {
    if (mainTab === 'mid' && !showMidTab) setMainTab('apercu')
  }, [mainTab, showMidTab])

  const segmentButtons = useMemo(() => {
    const a = {
      value: 'apercu' as const,
      label: 'Aperçu',
      icon: 'view-dashboard-outline' as const
    }
    const p = {
      value: 'parcours' as const,
      label: 'Parcours',
      icon: 'timeline-text-outline' as const
    }
    if (!showMidTab) return [a, p]
    const m = {
      value: 'mid' as const,
      label: user?.role === 'INSURED' ? 'Pièces' : 'Traitement',
      icon:
        user?.role === 'INSURED'
          ? ('file-document-outline' as const)
          : ('progress-wrench' as const)
    }
    return [a, m, p]
  }, [showMidTab, user?.role])

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

  const onImportStepDocument = useCallback(
    async (picked: PickedDocumentFile) => {
      if (!data?.scenario) return
      setStepImportBusy(true)
      setError(null)
      setInfo(null)
      try {
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
    },
    [data?.scenario, importDocType]
  )

  const onDepositRib = async (picked: PickedDocumentFile) => {
    setRibError(null)
    if (!data || data.is_closed) return
    setUploading(true)
    try {
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

  const onInsuredSupplementUpload = useCallback(
    async (picked: PickedDocumentFile) => {
      if (!data || data.is_closed) return
      setInsuredExtraBusy(true)
      setError(null)
      setInfo(null)
      try {
        const up = await uploadDocument(
          buildDocumentMultipartForm(insuredExtraType, {
            uri: picked.uri,
            name: picked.name,
            mime: picked.mime
          })
        )
        setInfo(
          `Document n°${up.data.id} reçu (${insuredExtraType}). Un gestionnaire pourra le valider.`
        )
        await load()
      } catch (e) {
        setError(e instanceof ApiRequestError ? e.message : 'Envoi impossible.')
      } finally {
        setInsuredExtraBusy(false)
      }
    },
    [data, insuredExtraType, load]
  )

  const docTypeOptions = useMemo(() => apiDocumentUploadTypesForRole(user?.role), [user?.role])

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
          <SegmentedButtons
            value={mainTab}
            onValueChange={(v) => setMainTab(v as 'apercu' | 'mid' | 'parcours')}
            buttons={segmentButtons}
            style={{ marginBottom: 8 }}
          />

          {mainTab === 'apercu' ? (
            <>
              <Surface
                style={{
                  borderRadius: 20,
                  padding: 18,
                  marginBottom: 16,
                  backgroundColor: theme.colors.surfaceVariant
                }}
                elevation={0}
              >
                <Text
                  variant="headlineSmall"
                  style={{ fontWeight: '700', color: BrandColors.primary }}
                >
                  {data.folder_reference || `Dossier #${id}`}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 12,
                    alignItems: 'center'
                  }}
                >
                  <Chip icon="information" compact mode="flat">
                    {labelFolderStatus(data.status)}
                  </Chip>
                  <Chip icon="car" compact mode="flat">
                    {labelScenario(data.scenario)}
                  </Chip>
                </View>
                {data.assignedOfficer ? (
                  <View style={{ marginTop: 14 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Chargé de suivi
                    </Text>
                    <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                      {displayUser(data.assignedOfficer)}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
                      {roleLabel(data.assignedOfficer.role)}
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 16
                  }}
                >
                  {sinisterId != null ? (
                    <Button
                      mode="contained-tonal"
                      compact
                      icon="car"
                      onPress={() => router.push(`/claim/${sinisterId}` as Href)}
                    >
                      Sinistre
                    </Button>
                  ) : null}
                  {canViewEntityHistory(user.role) ? (
                    <Button
                      mode="outlined"
                      compact
                      icon="history"
                      onPress={() =>
                        router.push(`/history?entity_type=folder&entity_id=${data.id}` as Href)
                      }
                    >
                      Historique
                    </Button>
                  ) : null}
                </View>
              </Surface>

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

          {!data.assignedOfficer && canAssignFolderOfficer(user.role) && !data.is_closed ? (
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
            </>
          ) : null}

          {mainTab === 'mid' && showMidTab ? (
            <>
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
                  Perte totale : importez le RIB (image ou PDF). Validation possible côté gestion.
                </Text>
                {ribError ? (
                  <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{ribError}</Text>
                ) : null}
                <DocumentSourceField
                  label="Importer le RIB"
                  description="Photo, galerie ou fichier (PDF, image). Le RIB est lié au dossier après envoi."
                  busy={uploading}
                  disabled={uploading}
                  onPick={(f) => void onDepositRib(f)}
                />
              </Card.Content>
            </Card>
          ) : null}

          {user.role === 'INSURED' && data && !data.is_closed ? (
            <Card style={{ marginBottom: 16 }} mode="outlined">
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 6 }}>
                  Autres justificatifs
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10, lineHeight: 20 }}
                >
                  Un type de pièce, un envoi. RIB en perte totale : utilisez l’import RIB
                  (onglet Pièces) lorsqu’il est proposé.
                </Text>
                <Menu
                  visible={insuredExtraMenu}
                  onDismiss={() => setInsuredExtraMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setInsuredExtraMenu(true)}
                      style={{ marginBottom: 8 }}
                    >
                      {apiDocumentUploadTypesForRole('INSURED').find(
                        (o) => o.value === insuredExtraType
                      )?.label ?? insuredExtraType}
                    </Button>
                  }
                >
                  {apiDocumentUploadTypesForRole('INSURED').map((o) => (
                    <Menu.Item
                      key={o.value}
                      onPress={() => {
                        setInsuredExtraType(o.value)
                        setInsuredExtraMenu(false)
                      }}
                      title={o.label}
                    />
                  ))}
                </Menu>
                <DocumentSourceField
                  label="Importer la pièce"
                  description={`Type sélectionné : ${
                    apiDocumentUploadTypesForRole('INSURED').find(
                      (o) => o.value === insuredExtraType
                    )?.label ?? insuredExtraType
                  }. Choisissez la source (photo, galerie, fichier).`}
                  busy={insuredExtraBusy}
                  disabled={insuredExtraBusy}
                  onPick={(f) => void onInsuredSupplementUpload(f)}
                />
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
                    Définissez d’abord le scénario du dossier (Aperçu), puis revenez ici.
                  </Text>
                ) : null}
                <HelperText type="info" padding="none" style={{ marginBottom: 6 }}>
                  {addStepDocRule.required
                    ? 'Document requis (type indiqué). Import ci-dessous → id renseigné auto.'
                    : 'Id document optionnel pour ce type. Import seulement si besoin d’un fichier.'}
                </HelperText>
                {addStepDocRule.required ? (
                  <Text
                    variant="labelLarge"
                    style={{ color: theme.colors.primary, marginBottom: 8, lineHeight: 20 }}
                  >
                    {labelLinkedDocumentTypeForStep(addStepDocRule.apiDocumentType)}
                  </Text>
                ) : null}
                {data.scenario ? (
                  <>
                    <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 4 }}>
                      Importer un document
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
                          {docTypeOptions.find((o) => o.value === importDocType)?.label ??
                            importDocType}
                        </Button>
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
                    <DocumentSourceField
                      label="Importer le document (étape)"
                      description={`Type d’enregistrement : ${
                        docTypeOptions.find((o) => o.value === importDocType)?.label ?? importDocType
                      }`}
                      busy={stepImportBusy}
                      disabled={stepImportBusy || actionBusy}
                      onPick={(f) => void onImportStepDocument(f)}
                    />
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
            </>
          ) : null}

          {mainTab === 'parcours' ? <FolderStepTimeline steps={data.steps} /> : null}
        </>
      ) : !error ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Chargement…
        </Text>
      ) : null}
    </ScrollView>
  )
}
