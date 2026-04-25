import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router'
import {
  Button,
  Card,
  Chip,
  Menu,
  SegmentedButtons,
  Surface,
  Divider,
  Text,
  useTheme
} from 'react-native-paper'
import { useAuth } from '@/auth'
import {
  createFolder,
  fetchSinister,
  updateSinister,
  uploadDocument,
  validateSinister
} from '@/api'
import type { SinisterDetailResponse, UserSummary } from '@/types/claims'
import { ApiRequestError } from '@/api/errors'
import { formatDate, labelSinisterStatus } from '@/utils/claimFormat'
import {
  roleLabel,
  canCreateClaim,
  canValidateClaim,
  canCreateFolderRecord,
  canForceCreateFolder,
  canViewEntityHistory,
  canDeclareOwnClaim
} from '@/utils/roleAccess'
import { BrandColors } from '@/constants/brand'
import { InsuredObligatoryDocRow } from '@/components/claim/InsuredObligatoryDocRow'
import type { PickedDocumentFile } from '@/utils/pickDocument'
import { buildDocumentMultipartForm } from '@/utils/documentFormData'

type ClaimBody = SinisterDetailResponse['data']

function displayUser(u: UserSummary): string {
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  if (n) return `${n} — ${u.email}`
  return u.email || u.username
}

export default function ClaimDetailScreen() {
  const theme = useTheme()
  const router = useRouter()
  const navigation = useNavigation()
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const { user, isReady } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [folderScenario, setFolderScenario] = useState<'REPAIRABLE' | 'TOTAL_LOSS' | 'none'>('none')
  const [title, setTitle] = useState('Sinistre')
  const [body, setBody] = useState<ClaimBody | null>(null)
  const [pieceBusy, setPieceBusy] = useState<'cni' | 'grise' | 'att' | null>(null)
  const [sendingStaged, setSendingStaged] = useState(false)
  /** Fichiers choisis, non encore envoyés à l’API (validation par le bouton en bas) */
  const [stagedPicks, setStagedPicks] = useState<
    Partial<Record<'cni' | 'grise' | 'att', PickedDocumentFile>>
  >({})
  const [mainTab, setMainTab] = useState<'apercu' | 'pieces' | 'gestion'>('apercu')

  const id = Number.parseInt(String(rawId), 10)

  const load = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) {
      setError('Identifiant invalide')
      return
    }
    setError(null)
    setInfo(null)
    try {
      const res = await fetchSinister(id)
      setBody(res.data)
      setTitle(res.data.vehicle_plate)
    } catch (e) {
      setBody(null)
      setError(e instanceof ApiRequestError ? e.message : 'Chargement impossible.')
    }
  }, [id])

  const onCreateFolder = useCallback(
    async (force: boolean) => {
      if (Number.isNaN(id) || id < 1) return
      setCreatingFolder(true)
      setError(null)
      setInfo(null)
      try {
        const payload: {
          sinister_id: number
          force?: boolean
          scenario?: 'REPAIRABLE' | 'TOTAL_LOSS'
        } = { sinister_id: id }
        if (force) payload.force = true
        if (folderScenario !== 'none') payload.scenario = folderScenario
        await createFolder(payload)
        setInfo(
          force
            ? 'Dossier créé. Vérifiez que toutes les pièces sont complètes dès que possible.'
            : 'Dossier créé. Vous pouvez l’ouvrir ci-dessous.'
        )
        await load()
      } catch (e) {
        setError(e instanceof ApiRequestError ? e.message : 'Création du dossier impossible.')
      } finally {
        setCreatingFolder(false)
      }
    },
    [id, folderScenario, load]
  )

  const kindToSpec = useCallback(
    (kind: 'cni' | 'grise' | 'att') =>
      kind === 'cni'
        ? { docType: 'ID_CARD' as const, field: 'cni_driver' as const }
        : kind === 'grise'
          ? {
              docType: 'REGISTRATION_CARD' as const,
              field: 'vehicle_registration_doc_id' as const
            }
          : { docType: 'INSURANCE_CERT' as const, field: 'insurance_certificate_id' as const },
    []
  )

  const clearStagedPick = useCallback((kind: 'cni' | 'grise' | 'att') => {
    setStagedPicks((s) => {
      if (s[kind] == null) return s
      const n = { ...s }
      delete n[kind]
      return n
    })
  }, [])

  const sendStagedPicks = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) return
    setSendingStaged(true)
    setError(null)
    setInfo(null)
    const order = ['cni', 'grise', 'att'] as const
    const working: Partial<Record<'cni' | 'grise' | 'att', PickedDocumentFile>> = {
      ...stagedPicks
    }
    const keys = order.filter((k) => working[k] != null)
    if (keys.length === 0) {
      setSendingStaged(false)
      return
    }
    try {
      for (const kind of keys) {
        const file = working[kind]
        if (!file) continue
        const spec = kindToSpec(kind)
        const { uri, name, mime } = file
        const up = await uploadDocument(
          buildDocumentMultipartForm(spec.docType, { uri, name, mime })
        )
        await updateSinister(id, { [spec.field]: up.data.id })
        delete working[kind]
      }
      setStagedPicks({})
      setInfo('Pièces enregistrées sur le sinistre.')
      await load()
    } catch (e) {
      setStagedPicks(working)
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Envoi d’au moins une pièce impossible. Les fichiers non envoyés restent en brouillon.'
      )
      void load()
    } finally {
      setSendingStaged(false)
    }
  }, [id, kindToSpec, load, stagedPicks])

  const removeObligatoryPiece = useCallback(
    (kind: 'cni' | 'grise' | 'att') => {
      if (Number.isNaN(id) || id < 1) return
      const field =
        kind === 'cni'
          ? 'cni_driver'
          : kind === 'grise'
            ? 'vehicle_registration_doc_id'
            : 'insurance_certificate_id'
      const label = kind === 'cni' ? 'la CNI' : kind === 'grise' ? 'la carte grise' : "l'attestation"
      Alert.alert(
        'Retirer la pièce',
        `Retirer ${label} de ce sinistre ? Vous pourrez en envoyer une autre ensuite.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setPieceBusy(kind)
                setError(null)
                setInfo(null)
                try {
                  await updateSinister(id, { [field]: null })
                  setStagedPicks((p) => {
                    const n = { ...p }
                    delete n[kind]
                    return n
                  })
                  setInfo('Pièce retirée. Vous pouvez en envoyer une autre si besoin.')
                  await load()
                } catch (e) {
                  setError(
                    e instanceof ApiRequestError ? e.message : 'Retrait de la pièce impossible.'
                  )
                } finally {
                  setPieceBusy(null)
                }
              })()
            }
          }
        ]
      )
    },
    [id, load]
  )

  const onValidate = useCallback(async () => {
    if (Number.isNaN(id) || id < 1) return
    setValidating(true)
    setError(null)
    setInfo(null)
    try {
      const res = await validateSinister(id)
      setInfo(res.message ?? 'Sinistre validé.')
      if (res.data) setBody(res.data as ClaimBody)
      else await load()
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : 'Validation impossible.')
    } finally {
      setValidating(false)
    }
  }, [id, load])

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  useEffect(() => {
    if (user) void load()
  }, [user, load])

  useLayoutEffect(() => {
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: BrandColors.primary
    })
  }, [navigation, title, theme.colors.surface])

  useLayoutEffect(() => {
    if (body?.vehicle_plate) {
      setTitle(body.vehicle_plate)
    }
  }, [body?.vehicle_plate])

  const showValidate = Boolean(
    user && canValidateClaim(user.role) && body && !body.is_validated_by_manager
  )

  const showDepotPieces = Boolean(
    user &&
      body &&
      !body.is_validated_by_manager &&
      (canCreateClaim(user.role) || canDeclareOwnClaim(user.role))
  )

  const showCreateFolder = Boolean(
    user &&
      body &&
      canCreateFolderRecord(user.role) &&
      !body.folder &&
      body.is_validated_by_manager
  )

  const scenarioLabel =
    folderScenario === 'none'
      ? 'Scénario (optionnel)'
      : folderScenario === 'REPAIRABLE'
        ? 'Véhicule réparable'
        : 'Perte totale'

  const showPiecesTab = Boolean(
    body &&
      (showDepotPieces ||
        body.cni_driver != null ||
        body.vehicle_registration_doc_id != null ||
        body.insurance_certificate_id != null)
  )
  const showGestionTab = Boolean(showValidate || showCreateFolder)

  const segmentButtons = useMemo(() => {
    const a = { value: 'apercu' as const, label: 'Aperçu', icon: 'view-dashboard-outline' as const }
    if (!showPiecesTab && !showGestionTab) {
      return [] as { value: string; label: string; icon: (typeof a)['icon'] }[]
    }
    if (showPiecesTab && !showGestionTab) {
      return [
        a,
        { value: 'pieces' as const, label: 'Pièces', icon: 'file-document-multiple-outline' as const }
      ]
    }
    if (!showPiecesTab && showGestionTab) {
      return [a, { value: 'gestion' as const, label: 'Gestion', icon: 'cog-outline' as const }]
    }
    return [
      a,
      { value: 'pieces' as const, label: 'Pièces', icon: 'file-document-multiple-outline' as const },
      { value: 'gestion' as const, label: 'Gestion', icon: 'cog-outline' as const }
    ]
  }, [showPiecesTab, showGestionTab])

  useEffect(() => {
    if (mainTab === 'pieces' && !showPiecesTab) setMainTab('apercu')
    if (mainTab === 'gestion' && !showGestionTab) setMainTab('apercu')
  }, [mainTab, showPiecesTab, showGestionTab])

  if (!user) return null

  const showApercu = mainTab === 'apercu' || segmentButtons.length === 0

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {error ? <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text> : null}
      {info ? <Text style={{ color: theme.colors.primary, marginBottom: 12 }}>{info}</Text> : null}

      {body ? (
        <>
          {segmentButtons.length > 0 ? (
            <SegmentedButtons
              value={mainTab}
              onValueChange={(v) => setMainTab(v as 'apercu' | 'pieces' | 'gestion')}
              buttons={segmentButtons}
              style={{ marginBottom: 8 }}
            />
          ) : null}

          {showApercu ? (
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
                  {body.vehicle_plate}
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
                  <Chip icon="shield-check" compact mode="flat">
                    {labelSinisterStatus(body.status)}
                  </Chip>
                </View>
                {canViewEntityHistory(user.role) ? (
                  <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <Button
                      mode="outlined"
                      compact
                      icon="history"
                      onPress={() =>
                        router.push(`/history?entity_type=sinister&entity_id=${body.id}` as Href)
                      }
                    >
                      Historique
                    </Button>
                  </View>
                ) : null}
              </Surface>

              {body.creator || body.insuredUser || body.folder?.assignedOfficer ? (
                <Surface
                  style={{
                    borderRadius: 16,
                    padding: 4,
                    marginBottom: 12,
                    backgroundColor: theme.colors.surface
                  }}
                  elevation={0}
                >
                  {body.creator ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        gap: 12
                      }}
                    >
                      <MaterialCommunityIcons
                        name="account-circle-outline"
                        size={24}
                        color={BrandColors.primary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Déclaration
                        </Text>
                        <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                          {displayUser(body.creator)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                          {roleLabel(body.creator.role)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  {body.creator && (body.insuredUser || body.folder?.assignedOfficer) ? (
                    <Divider style={{ marginHorizontal: 8 }} />
                  ) : null}
                  {body.insuredUser ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        gap: 12
                      }}
                    >
                      <MaterialCommunityIcons
                        name="shield-account-outline"
                        size={24}
                        color={BrandColors.primary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Assuré
                        </Text>
                        <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                          {displayUser(body.insuredUser)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  {body.insuredUser && body.folder?.assignedOfficer ? <Divider style={{ marginHorizontal: 8 }} /> : null}
                  {body.folder?.assignedOfficer ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        gap: 12
                      }}
                    >
                      <MaterialCommunityIcons
                        name="account-supervisor-outline"
                        size={24}
                        color={BrandColors.primary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Chargé de suivi (dossier)
                        </Text>
                        <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                          {displayUser(body.folder.assignedOfficer)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </Surface>
              ) : null}

              <Surface
                style={{
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: theme.colors.elevation?.level1 ?? theme.colors.surface
                }}
                elevation={0}
              >
                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                  Détail du sinistre
                </Text>
                <View style={{ flexDirection: 'row', marginBottom: 12, gap: 12, alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={22}
                    color={theme.colors.primary}
                    style={{ marginTop: 2 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Date du sinistre
                    </Text>
                    <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                      {formatDate(body.incident_datetime)}
                    </Text>
                  </View>
                </View>
                {body.call_datetime ? (
                  <View style={{ flexDirection: 'row', marginBottom: 12, gap: 12, alignItems: 'flex-start' }}>
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Appel
                      </Text>
                      <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                        {formatDate(body.call_datetime)}
                      </Text>
                    </View>
                  </View>
                ) : null}
                {(body.driver_first_name || body.driver_last_name) && (
                  <View style={{ flexDirection: 'row', marginBottom: 12, gap: 12, alignItems: 'flex-start' }}>
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Conducteur
                      </Text>
                      <Text variant="bodyMedium" style={{ marginTop: 2 }}>
                        {[body.driver_first_name, body.driver_last_name].filter(Boolean).join(' ')}
                      </Text>
                    </View>
                  </View>
                )}
                {body.description ? (
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    <MaterialCommunityIcons
                      name="text"
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Contexte
                      </Text>
                      <Text variant="bodyMedium" style={{ marginTop: 2, lineHeight: 22 }}>
                        {body.description}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Surface>

              {body.folder ? (
                <Button
                  mode="contained"
                  buttonColor={BrandColors.primary}
                  onPress={() => router.push(`/folder/${body.folder!.id}` as Href)}
                  style={{ marginTop: 4, marginBottom: 8, borderRadius: 10 }}
                >
                  Ouvrir le dossier{' '}
                  {body.folder.folder_reference
                    ? `(${body.folder.folder_reference})`
                    : `#${body.folder.id}`}
                </Button>
              ) : null}
            </>
          ) : null}

          {mainTab === 'pieces' && showPiecesTab ? (
            <Card style={{ marginBottom: 12 }} mode="outlined">
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 4 }}>
                  Pièces : CNI, carte grise, attestation
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 4,
                    lineHeight: 20
                  }}
                >
                  {canDeclareOwnClaim(user.role)
                    ? 'Sélectionnez chaque document (photo, galerie ou fichier), puis validez en bas. Contrôle par un gestionnaire ensuite. RIB (perte totale) : onglet Dossier.'
                    : 'Choix des fichiers en brouillon, puis envoi groupé. Touchez l’aperçu pour le détail des pièces déjà reçues.'}
                </Text>
                {showDepotPieces ? (
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.outline, marginBottom: 12, lineHeight: 16 }}
                  >
                    {
                      'Aucun envoi serveur tant que vous n’appuyez pas sur le bouton « Envoyer les pièces » ci-dessous.'
                    }
                  </Text>
                ) : null}
                <InsuredObligatoryDocRow
                  title="CNI / pièce d’identité"
                  documentId={body.cni_driver ?? null}
                  stagedFile={stagedPicks.cni ?? null}
                  isValidated={body.cniDocument == null ? null : Boolean(body.cniDocument.is_validated)}
                  showPicker={showDepotPieces}
                  busy={sendingStaged || pieceBusy === 'cni'}
                  anyBusy={sendingStaged || pieceBusy != null}
                  onPick={(f) => setStagedPicks((s) => ({ ...s, cni: f }))}
                  onRemove={
                    showDepotPieces && !sendingStaged
                      ? stagedPicks.cni
                        ? () => clearStagedPick('cni')
                        : body.cni_driver != null
                          ? () => removeObligatoryPiece('cni')
                          : undefined
                      : undefined
                  }
                />
                <InsuredObligatoryDocRow
                  title="Carte grise"
                  documentId={body.vehicle_registration_doc_id ?? null}
                  stagedFile={stagedPicks.grise ?? null}
                  isValidated={
                    body.registrationDocument == null
                      ? null
                      : Boolean(body.registrationDocument.is_validated)
                  }
                  showPicker={showDepotPieces}
                  busy={sendingStaged || pieceBusy === 'grise'}
                  anyBusy={sendingStaged || pieceBusy != null}
                  onPick={(f) => setStagedPicks((s) => ({ ...s, grise: f }))}
                  onRemove={
                    showDepotPieces && !sendingStaged
                      ? stagedPicks.grise
                        ? () => clearStagedPick('grise')
                        : body.vehicle_registration_doc_id != null
                          ? () => removeObligatoryPiece('grise')
                          : undefined
                      : undefined
                  }
                />
                <InsuredObligatoryDocRow
                  title="Attestation d’assurance"
                  documentId={body.insurance_certificate_id ?? null}
                  stagedFile={stagedPicks.att ?? null}
                  isValidated={
                    body.insuranceDocument == null
                      ? null
                      : Boolean(body.insuranceDocument.is_validated)
                  }
                  showPicker={showDepotPieces}
                  busy={sendingStaged || pieceBusy === 'att'}
                  anyBusy={sendingStaged || pieceBusy != null}
                  onPick={(f) => setStagedPicks((s) => ({ ...s, att: f }))}
                  onRemove={
                    showDepotPieces && !sendingStaged
                      ? stagedPicks.att
                        ? () => clearStagedPick('att')
                        : body.insurance_certificate_id != null
                          ? () => removeObligatoryPiece('att')
                          : undefined
                      : undefined
                  }
                />
                {showDepotPieces &&
                (stagedPicks.cni != null || stagedPicks.grise != null || stagedPicks.att != null) ? (
                  <Button
                    mode="contained"
                    onPress={() => void sendStagedPicks()}
                    loading={sendingStaged}
                    disabled={sendingStaged}
                    buttonColor={BrandColors.primary}
                    style={{ marginTop: 4, borderRadius: 10 }}
                    contentStyle={{ paddingVertical: 4 }}
                  >
                    Envoyer les pièces
                  </Button>
                ) : null}
              </Card.Content>
            </Card>
          ) : null}

          {mainTab === 'gestion' && showGestionTab ? (
            <>
              {showValidate ? (
                <Button
                  mode="contained"
                  onPress={onValidate}
                  loading={validating}
                  disabled={validating}
                  buttonColor={BrandColors.primary}
                  style={{ marginBottom: 12, borderRadius: 10 }}
                >
                  Valider le sinistre (gestionnaire)
                </Button>
              ) : null}
              {showCreateFolder ? (
                <Card style={{ marginBottom: 12 }} mode="outlined">
                  <Card.Content>
                    <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>
                      Ouvrir un dossier de prise en charge
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
                    >
                      Sinistre validé : les trois pièces (CNI, carte grise, attestation) doivent
                      être <Text style={{ fontWeight: '600' }}>validées</Text> chacune avant{' '}
                      <Text style={{ fontWeight: '600' }}>Créer le dossier</Text>.
                    </Text>
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10 }}
                    >
                      Pièces incomplètes : <Text style={{ fontWeight: '600' }}>Forcer la création</Text>{' '}
                      (gestionnaire / admin) si autorisé.
                    </Text>
                    <Menu
                      visible={scenarioOpen}
                      onDismiss={() => setScenarioOpen(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setScenarioOpen(true)}
                          style={{ marginBottom: 8 }}
                        >
                          {scenarioLabel}
                        </Button>
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          setFolderScenario('none')
                          setScenarioOpen(false)
                        }}
                        title="Scénario défini à l’ouverture"
                      />
                      <Menu.Item
                        onPress={() => {
                          setFolderScenario('REPAIRABLE')
                          setScenarioOpen(false)
                        }}
                        title="Véhicule réparable"
                      />
                      <Menu.Item
                        onPress={() => {
                          setFolderScenario('TOTAL_LOSS')
                          setScenarioOpen(false)
                        }}
                        title="Perte totale"
                      />
                    </Menu>
                    <Button
                      mode="contained"
                      buttonColor={BrandColors.primary}
                      onPress={() => onCreateFolder(false)}
                      loading={creatingFolder}
                      disabled={creatingFolder}
                      style={{ borderRadius: 10, marginBottom: 8 }}
                    >
                      Créer le dossier
                    </Button>
                    {canForceCreateFolder(user.role) ? (
                      <Button
                        mode="outlined"
                        onPress={() => onCreateFolder(true)}
                        loading={creatingFolder}
                        disabled={creatingFolder}
                        style={{ borderRadius: 10 }}
                      >
                        Forcer la création (pièces incomplètes)
                      </Button>
                    ) : null}
                  </Card.Content>
                </Card>
              ) : null}
            </>
          ) : null}
        </>
      ) : !error ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Chargement…
        </Text>
      ) : null}
    </ScrollView>
  )
}
