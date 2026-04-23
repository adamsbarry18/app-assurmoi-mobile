import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper'
import { useAuth } from '@/features/auth'
import { fetchEntityHistory, type HistoryEntityType, type HistoryLogRow } from '@/lib/historyApi'
import { labelHistoryAction } from '@/lib/historyFormat'
import { formatDate } from '@/lib/claimFormat'
import { ApiRequestError } from '@/lib/apiErrors'
import { canViewEntityHistory } from '@/lib/roleAccess'
import { BrandColors } from '@/constants/brand'

function paramStr(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined
  return Array.isArray(v) ? v[0] : v
}

function displayActorName(a: {
  first_name: string | null
  last_name: string | null
  email: string
  username: string
}): string {
  const n = [a.first_name, a.last_name].filter(Boolean).join(' ').trim()
  if (n) return n
  return a.email || a.username
}

export default function EntityHistoryScreen() {
  const theme = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const p = useLocalSearchParams<{
    entity_type?: string | string[]
    entity_id?: string | string[]
  }>()
  const { user, isReady } = useAuth()
  const [rows, setRows] = useState<HistoryLogRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const et = paramStr(p.entity_type) as HistoryEntityType | undefined
  const eidRaw = paramStr(p.entity_id)
  const eid = eidRaw != null ? Number.parseInt(eidRaw, 10) : Number.NaN

  const load = useCallback(async () => {
    if (!et || !Number.isFinite(eid) || eid < 1) {
      setError('Lien d’historique invalide (entity_type / entity_id).')
      setRows([])
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetchEntityHistory(et, eid)
      setRows(res.data)
    } catch (e) {
      setRows([])
      setError(e instanceof ApiRequestError ? e.message : 'Chargement de l’historique impossible.')
    } finally {
      setLoading(false)
    }
  }, [et, eid])

  useLayoutEffect(() => {
    const title = et ? `Historique · ${et}` : 'Historique'
    navigation.setOptions({
      title,
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTintColor: BrandColors.primary
    })
  }, [navigation, et, theme.colors.surface])

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  useEffect(() => {
    if (isReady && user && !canViewEntityHistory(user.role)) {
      router.replace('/(main)/home')
    }
  }, [isReady, user, router])

  useEffect(() => {
    if (user && canViewEntityHistory(user.role) && et && Number.isFinite(eid) && eid > 0) {
      void load()
    }
  }, [user, et, eid, load])

  if (!user || !canViewEntityHistory(user.role)) return null

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {error ? <Text style={{ color: theme.colors.error, padding: 16 }}>{error}</Text> : null}
      {loading ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Aucun événement enregistré pour cette entité.
            </Text>
          }
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }} mode="outlined">
              <Card.Content>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                >
                  {item.created_at ? formatDate(item.created_at) : '—'}
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {labelHistoryAction(item.action ?? undefined)}
                </Text>
                {item.actor ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
                    {displayActorName(item.actor)}
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  )
}
