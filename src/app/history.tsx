import { useCallback, useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Divider, Text, useTheme } from 'react-native-paper'
import { useAuth } from '@/auth'
import { ApiRequestError, fetchEntityHistory, type HistoryEntityType, type HistoryLogRow } from '@/api'
import type { UserSummary } from '@/types/claims'
import { formatDate } from '@/utils/claimFormat'
import { labelHistoryAction } from '@/utils/historyFormat'
import { BrandColors } from '@/constants/brand'

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined
  return Array.isArray(v) ? v[0] : v
}

function displayActor(u: UserSummary): string {
  const n = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  if (n) return `${n} — ${u.email}`
  return u.email || u.username
}

function isEntityType(s: string | undefined): s is HistoryEntityType {
  return (
    s === 'sinister' ||
    s === 'document' ||
    s === 'folder' ||
    s === 'folder_step' ||
    s === 'user'
  )
}

function labelEntityFr(t: HistoryEntityType): string {
  const m: Record<HistoryEntityType, string> = {
    sinister: 'Sinistre',
    document: 'Document',
    folder: 'Dossier',
    folder_step: 'Étape dossier',
    user: 'Utilisateur'
  }
  return m[t]
}

export default function HistoryScreen() {
  const theme = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ entity_type?: string | string[]; entity_id?: string | string[] }>()
  const { user, isReady } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<HistoryLogRow[]>([])

  const entityTypeRaw = useMemo(() => firstParam(params.entity_type), [params.entity_type])
  const entityIdRaw = useMemo(() => firstParam(params.entity_id), [params.entity_id])

  const entityId = useMemo(() => {
    const n = entityIdRaw != null ? Number.parseInt(String(entityIdRaw), 10) : NaN
    return Number.isFinite(n) && n > 0 ? n : NaN
  }, [entityIdRaw])

  const validParams = isEntityType(entityTypeRaw) && !Number.isNaN(entityId)

  const load = useCallback(async () => {
    if (!user || !validParams || !isEntityType(entityTypeRaw)) {
      setLoading(false)
      if (user && !validParams) {
        setError('Impossible d’ouvrir cet historique : informations manquantes ou lien incorrect.')
      }
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetchEntityHistory(entityTypeRaw, entityId)
      setRows(res.data)
    } catch (e) {
      setRows([])
      setError(e instanceof ApiRequestError ? e.message : 'Chargement impossible.')
    } finally {
      setLoading(false)
    }
  }, [user, validParams, entityTypeRaw, entityId])

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  useEffect(() => {
    if (user && isReady) void load()
  }, [user, isReady, load])

  if (!user) return null

  const subtitle =
    validParams && isEntityType(entityTypeRaw)
      ? `${labelEntityFr(entityTypeRaw)} · n°${entityId}`
      : 'Journal des actions'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
        {subtitle}
      </Text>
      {error ? <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{error}</Text> : null}
      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator color={BrandColors.primary} />
        </View>
      ) : null}
      {!loading && validParams && rows.length === 0 && !error ? (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Aucune entrée d’historique pour cette ressource.
        </Text>
      ) : null}
      {!loading && rows.length > 0 ? (
        <View>
          {rows.map((row, i) => (
            <View key={row.id}>
              {i > 0 ? <Divider style={{ marginVertical: 10 }} /> : null}
              <Text variant="labelLarge" style={{ color: BrandColors.primary, fontWeight: '600' }}>
                {labelHistoryAction(row.action)}
              </Text>
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
              >
                {formatDate(row.created_at)}
              </Text>
              {row.actor ? (
                <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 6 }}>
                  {displayActor(row.actor)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  )
}
