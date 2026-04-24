import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter, type Href } from 'expo-router'
import { Button, Card, Text, useTheme, Menu } from 'react-native-paper'
import { useAuth } from '@/features/auth'
import {
  createFolder,
  fetchSinister,
  updateSinister,
  uploadDocument,
  validateSinister
} from '@/lib/claimsApi'
import type { SinisterDetailResponse, UserSummary } from '@/lib/claimsTypes'
import { ApiRequestError } from '@/lib/apiErrors'
import { formatDate, labelSinisterStatus } from '@/lib/claimFormat'
import {
  roleLabel,
  canCreateClaim,
  canValidateClaim,
  canCreateFolderRecord,
  canForceCreateFolder,
  canViewEntityHistory,
  canDeclareOwnClaim
} from '@/lib/roleAccess'
import { BrandColors } from '@/constants/brand'
import { pickDocumentFile } from '@/lib/pickDocument'
import { buildDocumentMultipartForm } from '@/lib/documentFormData'

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
            ? 'Dossier créé (mode forcé). Vérifiez les pièces côté back-office si besoin.'
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

  const uploadObligatoryPiece = useCallback(
    async (kind: 'cni' | 'grise' | 'att') => {
      if (Number.isNaN(id) || id < 1) return
      setPieceBusy(kind)
      setError(null)
      setInfo(null)
      try {
        const asset = await pickDocumentFile()
        if (!asset) {
          return
        }
        const { uri, name, mime } = asset
        const spec =
          kind === 'cni'
            ? { docType: 'ID_CARD' as const, field: 'cni_driver' as const }
            : kind === 'grise'
              ? {
                  docType: 'REGISTRATION_CARD' as const,
                  field: 'vehicle_registration_doc_id' as const
                }
              : { docType: 'INSURANCE_CERT' as const, field: 'insurance_certificate_id' as const }
        const up = await uploadDocument(buildDocumentMultipartForm(spec.docType, { uri, name, mime }))
        await updateSinister(id, { [spec.field]: up.data.id })
        setInfo(
          'Document importé et lié au sinistre. Faites valider chaque pièce (écran document), puis validez le sinistre.'
        )
        await load()
      } catch (e) {
        setError(e instanceof ApiRequestError ? e.message : 'Dépôt ou rattachement impossible.')
      } finally {
        setPieceBusy(null)
      }
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

  if (!user) return null

  const showValidate = canValidateClaim(user.role) && body && !body.is_validated_by_manager

  const showDepotPieces = Boolean(
    body && canCreateClaim(user.role) && !body.is_validated_by_manager
  )

  const showCreateFolder =
    body && canCreateFolderRecord(user.role) && !body.folder && body.is_validated_by_manager

  const scenarioLabel =
    folderScenario === 'none'
      ? 'Scénario (optionnel)'
      : folderScenario === 'REPAIRABLE'
        ? 'Véhicule réparable'
        : 'Perte totale'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {error ? <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text> : null}
      {info ? <Text style={{ color: theme.colors.primary, marginBottom: 12 }}>{info}</Text> : null}

      {body ? (
        <>
          {canDeclareOwnClaim(user.role) ? (
            <Card
              style={{ marginBottom: 12, borderColor: theme.colors.outlineVariant }}
              mode="outlined"
            >
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 6 }}>
                  Pièces justificatives
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}
                >
                  CNI, carte grise et attestation sont en principe déposées par votre interlocuteur
                  AssurMoi (chargé de clientèle / gestionnaire). Le dépôt du{' '}
                  <Text style={{ fontWeight: '600' }}>RIB</Text> (perte totale) se fait depuis
                  l’écran <Text style={{ fontWeight: '600' }}>Dossier</Text> lorsque l’étape est
                  ouverte.
                </Text>
              </Card.Content>
            </Card>
          ) : null}
          <Card style={{ marginBottom: 12 }} mode="outlined">
            <Card.Content>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}
              >
                Statut
              </Text>
              <Text variant="bodyLarge" style={{ fontWeight: '600', color: BrandColors.primary }}>
                {labelSinisterStatus(body.status)}
              </Text>
            </Card.Content>
          </Card>
          {body.creator ? (
            <Card style={{ marginBottom: 12 }} mode="outlined">
              <Card.Content>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                >
                  Déclaration enregistrée par
                </Text>
                <Text variant="bodyMedium">{displayUser(body.creator)}</Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                >
                  {roleLabel(body.creator.role)}
                </Text>
              </Card.Content>
            </Card>
          ) : null}
          {body.insuredUser ? (
            <Card style={{ marginBottom: 12 }} mode="outlined">
              <Card.Content>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                >
                  Compte assuré rattaché
                </Text>
                <Text variant="bodyMedium">{displayUser(body.insuredUser)}</Text>
              </Card.Content>
            </Card>
          ) : null}
          {canViewEntityHistory(user.role) ? (
            <Button
              mode="outlined"
              onPress={() =>
                router.push(`/history?entity_type=sinister&entity_id=${body.id}` as Href)
              }
              style={{ marginBottom: 12 }}
            >
              Historique du sinistre
            </Button>
          ) : null}
          {showDepotPieces ||
          body.cni_driver != null ||
          body.vehicle_registration_doc_id != null ||
          body.insurance_certificate_id != null ? (
            <Card style={{ marginBottom: 12 }} mode="outlined">
              <Card.Content>
                <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8 }}>
                  Pièces obligatoires (CNI, carte grise, attestation)
                </Text>
                {showDepotPieces ? (
                  <>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        marginBottom: 10,
                        lineHeight: 20
                      }}
                    >
                      Importez chaque type (dépôt), le sinistre est mis à jour.
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => void uploadObligatoryPiece('cni')}
                      loading={pieceBusy === 'cni'}
                      disabled={pieceBusy != null}
                      style={{ marginBottom: 8 }}
                    >
                      {body.cni_driver != null
                        ? `Remplacer CNI (actuellement n°${body.cni_driver})`
                        : 'Importer CNI / pièce d’identité'}
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => void uploadObligatoryPiece('grise')}
                      loading={pieceBusy === 'grise'}
                      disabled={pieceBusy != null}
                      style={{ marginBottom: 8 }}
                    >
                      {body.vehicle_registration_doc_id != null
                        ? `Remplacer carte grise (n°${body.vehicle_registration_doc_id})`
                        : 'Importer la carte grise'}
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => void uploadObligatoryPiece('att')}
                      loading={pieceBusy === 'att'}
                      disabled={pieceBusy != null}
                      style={{ marginBottom: 8 }}
                    >
                      {body.insurance_certificate_id != null
                        ? `Remplacer attestation (n°${body.insurance_certificate_id})`
                        : 'Importer l’attestation d’assurance'}
                    </Button>
                  </>
                ) : null}
                {body.cni_driver != null ? (
                  <Pressable
                    onPress={() => router.push(`/document/${body.cni_driver}` as Href)}
                    style={{ marginBottom: 6 }}
                  >
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      CNI / pièce d’identité — document n°{body.cni_driver}
                    </Text>
                  </Pressable>
                ) : null}
                {body.vehicle_registration_doc_id != null ? (
                  <Pressable
                    onPress={() =>
                      router.push(`/document/${body.vehicle_registration_doc_id}` as Href)
                    }
                    style={{ marginBottom: 6 }}
                  >
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      Carte grise — document n°{body.vehicle_registration_doc_id}
                    </Text>
                  </Pressable>
                ) : null}
                {body.insurance_certificate_id != null ? (
                  <Pressable
                    onPress={() =>
                      router.push(`/document/${body.insurance_certificate_id}` as Href)
                    }
                  >
                    <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
                      Attestation d’assurance — document n°{body.insurance_certificate_id}
                    </Text>
                  </Pressable>
                ) : null}
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}
                >
                  Touchez une ligne pour le détail / validation des pièces.
                </Text>
              </Card.Content>
            </Card>
          ) : null}
          {body.folder?.assignedOfficer ? (
            <Card style={{ marginBottom: 12 }} mode="outlined">
              <Card.Content>
                <Text
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                >
                  Chargé de suivi (dossier)
                </Text>
                <Text variant="bodyMedium">{displayUser(body.folder.assignedOfficer)}</Text>
              </Card.Content>
            </Card>
          ) : null}
          <Card style={{ marginBottom: 12 }} mode="outlined">
            <Card.Content>
              <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Date du sinistre : </Text>
                {formatDate(body.incident_datetime)}
              </Text>
              {body.call_datetime ? (
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Appel : </Text>
                  {formatDate(body.call_datetime)}
                </Text>
              ) : null}
              {(body.driver_first_name || body.driver_last_name) && (
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Conducteur : </Text>
                  {[body.driver_first_name, body.driver_last_name].filter(Boolean).join(' ')}
                </Text>
              )}
              {body.description ? (
                <Text variant="bodyMedium" style={{ marginTop: 4 }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Contexte : </Text>
                  {body.description}
                </Text>
              ) : null}
            </Card.Content>
          </Card>
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
                  Le sinistre est validé. Pour{' '}
                  <Text style={{ fontWeight: '600' }}>Créer le dossier</Text> sans forcer. Les{' '}
                  <Text style={{ fontWeight: '600' }}>trois</Text> pièces (CNI, carte grise,
                  attestation) sont obligatoire <Text style={{ fontWeight: '600' }}>et</Text>{' '}
                  chacune doit être validée.
                </Text>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10 }}
                >
                  Si les pièces ne sont pas encore toutes validées : utilisez{' '}
                  <Text style={{ fontWeight: '600' }}>Forcer la création</Text> (gestionnaire /
                  admin) pour ouvrir le dossier quand même.
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
                    title="Non défini (API par défaut)"
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
          {body.folder ? (
            <Button
              mode="contained"
              buttonColor={BrandColors.primary}
              onPress={() => router.push(`/folder/${body.folder!.id}` as Href)}
              style={{ marginTop: 8, borderRadius: 10 }}
            >
              Ouvrir le dossier{' '}
              {body.folder.folder_reference
                ? `(${body.folder.folder_reference})`
                : `#${body.folder.id}`}
            </Button>
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
