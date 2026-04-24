import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import {
  Button,
  Menu,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper'
import { useAuth } from '@/features/auth'
import { createSinister } from '@/lib/claimsApi'
import { fetchInsuredOptions } from '@/lib/usersApi'
import { ApiRequestError } from '@/lib/apiErrors'
import { canCreateClaim, canCreateSinister, canDeclareOwnClaim } from '@/lib/roleAccess'
import type { AuthUser } from '@/lib/auth/types'
import { BrandColors } from '@/constants/brand'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function defaultIncidentParts(): { date: string; time: string } {
  const d = new Date()
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  }
}

function toIsoFromLocal(dateStr: string, timeStr: string): string {
  const d = dateStr.trim()
  const raw = (timeStr.trim() || '12:00').slice(0, 5)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error('Date du sinistre : format AAAA-MM-JJ attendu')
  }
  if (!/^\d{1,2}:\d{2}$/.test(raw)) {
    throw new Error('Heure du sinistre : format HH:MM attendu')
  }
  const [h, m] = raw.split(':').map((x) => Number.parseInt(x, 10))
  const t = `${pad2(h)}:${pad2(m)}:00`
  const ms = Date.parse(`${d}T${t}`)
  if (Number.isNaN(ms)) {
    throw new Error('Date ou heure du sinistre invalide')
  }
  return new Date(ms).toISOString()
}

function displayName(u: AuthUser): string {
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  if (n) return `${n} (${u.email})`
  return u.email || u.username
}

export default function CreateClaimScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady } = useAuth()
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [insuredList, setInsuredList] = useState<AuthUser[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [insuredId, setInsuredId] = useState<number | null>(null)
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [description, setDescription] = useState('')
  const [driverFirst, setDriverFirst] = useState('')
  const [driverLast, setDriverLast] = useState('')
  const [isDriverInsured, setIsDriverInsured] = useState(true)
  const [driverResponsability, setDriverResponsability] = useState(true)
  const [responsibilityPct, setResponsibilityPct] = useState<string>('100')
  const initialIncident = useMemo(() => defaultIncidentParts(), [])
  const [incidentDate, setIncidentDate] = useState(initialIncident.date)
  const [incidentTime, setIncidentTime] = useState(initialIncident.time)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const loadInsured = useCallback(async () => {
    if (!user || !canCreateClaim(user.role) || canDeclareOwnClaim(user.role)) return
    setLoadingOptions(true)
    setOptionsError(null)
    try {
      const res = await fetchInsuredOptions({ limit: 150 })
      setInsuredList(res.data)
    } catch (e) {
      setInsuredList([])
      setOptionsError(
        e instanceof ApiRequestError ? e.message : 'Impossible de charger la liste des assurés.'
      )
    } finally {
      setLoadingOptions(false)
    }
  }, [user])

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  useEffect(() => {
    if (user && !canCreateSinister(user.role)) {
      router.replace('/(main)/claims' as Href)
    }
  }, [user, router])

  useEffect(() => {
    if (user && canCreateClaim(user.role) && !canDeclareOwnClaim(user.role)) void loadInsured()
  }, [user, loadInsured])

  const selectedInsured = useMemo(
    () => insuredList.find((i) => i.id === insuredId),
    [insuredList, insuredId]
  )
  const selectedLabel =
    insuredId == null
      ? 'Aucun (non rattaché)'
      : selectedInsured
        ? displayName(selectedInsured)
        : `#${insuredId}`

  const onSubmit = async () => {
    setError(null)
    const plate = vehiclePlate.trim()
    if (!plate) {
      setError('Indiquez l’immatriculation du véhicule.')
      return
    }
    let incidentIso: string
    try {
      incidentIso = toIsoFromLocal(incidentDate, incidentTime)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Date du sinistre invalide')
      return
    }
    const pct = driverResponsability ? (Number(responsibilityPct) as 0 | 50 | 100) : 0
    if (!user) return
    setSubmitting(true)
    try {
      const isInsured = user.role === 'INSURED'
      const res = await createSinister({
        vehicle_plate: plate,
        call_datetime: new Date().toISOString(),
        incident_datetime: incidentIso,
        description: description.trim() || null,
        driver_first_name: driverFirst.trim() || null,
        driver_last_name: driverLast.trim() || null,
        is_driver_insured: isDriverInsured,
        driver_responsability: driverResponsability,
        driver_engaged_responsibility: driverResponsability ? pct : 0,
        ...(!isInsured ? { insured_user_id: insuredId } : {})
      })
      router.replace(`/claim/${res.data.id}` as Href)
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : 'Enregistrement impossible. Vérifiez les champs et réessayez.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || !canCreateSinister(user.role)) {
    return null
  }

  const isInsured = user.role === 'INSURED'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
        {isInsured
          ? 'Déclaration de sinistre. Votre dossier sera examiné par un gestionnaire (validation requise). L’heure d’appel enregistrée est celle d’envoi du formulaire.'
          : 'Déclaration pour l’équipe interne. L’heure d’enregistrement de l’appel est celle d’envoi du formulaire.'}
      </Text>

      {error ? <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text> : null}

      <TextInput
        label="Immatriculation *"
        value={vehiclePlate}
        onChangeText={setVehiclePlate}
        autoCapitalize="characters"
        mode="outlined"
        style={{ marginBottom: 12 }}
      />

      <TextInput
        label="Date du sinistre (AAAA-MM-JJ) *"
        value={incidentDate}
        onChangeText={setIncidentDate}
        mode="outlined"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="Heure du sinistre (HH:MM) *"
        value={incidentTime}
        onChangeText={setIncidentTime}
        mode="outlined"
        style={{ marginBottom: 12 }}
      />

      <TextInput
        label="Contexte (optionnel)"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={{ marginBottom: 12 }}
      />

      <TextInput
        label="Prénom conducteur"
        value={driverFirst}
        onChangeText={setDriverFirst}
        mode="outlined"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="Nom conducteur"
        value={driverLast}
        onChangeText={setDriverLast}
        mode="outlined"
        style={{ marginBottom: 12 }}
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8
        }}
      >
        <Text variant="bodyLarge">Le conducteur est assuré</Text>
        <Switch value={isDriverInsured} onValueChange={setIsDriverInsured} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12
        }}
      >
        <Text variant="bodyLarge">Responsabilité conducteur</Text>
        <Switch value={driverResponsability} onValueChange={setDriverResponsability} />
      </View>

      {driverResponsability ? (
        <View style={{ marginBottom: 16 }}>
          <Text
            variant="labelLarge"
            style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}
          >
            Part retenue (%)
          </Text>
          <SegmentedButtons
            value={responsibilityPct}
            onValueChange={setResponsibilityPct}
            buttons={[
              { value: '0', label: '0' },
              { value: '50', label: '50' },
              { value: '100', label: '100' }
            ]}
          />
        </View>
      ) : null}

      {!isInsured ? (
        <>
          <Text
            variant="labelLarge"
            style={{ marginBottom: 8, color: theme.colors.onSurfaceVariant }}
          >
            Rattacher à un compte assuré (optionnel)
          </Text>
          {optionsError ? (
            <Text style={{ color: theme.colors.error, marginBottom: 8, fontSize: 13 }}>
              {optionsError} — Vous pouvez enregistrer le sinistre sans rattachement.
            </Text>
          ) : null}
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuOpen(true)}
                style={{ marginBottom: 8 }}
                loading={loadingOptions}
                disabled={loadingOptions}
              >
                {selectedLabel}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setInsuredId(null)
                setMenuOpen(false)
              }}
              title="Aucun (non rattaché)"
            />
            {insuredList.map((u) => (
              <Menu.Item
                key={u.id}
                onPress={() => {
                  setInsuredId(u.id)
                  setMenuOpen(false)
                }}
                title={displayName(u)}
              />
            ))}
          </Menu>
        </>
      ) : (
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
        >
          Compte rattaché : <Text style={{ fontWeight: '600' }}>vous (assuré)</Text>
        </Text>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={submitting}
        disabled={submitting}
        buttonColor={BrandColors.primary}
        style={{ marginTop: 12, borderRadius: 10 }}
      >
        Enregistrer le sinistre
      </Button>
    </ScrollView>
  )
}
