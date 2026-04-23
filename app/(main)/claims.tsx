import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { type Href, useRouter } from 'expo-router'
import { ActivityIndicator, Card, FAB, Text, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '@/features/auth'
import { fetchSinisters } from '@/lib/claimsApi'
import type { SinisterRow } from '@/lib/claimsTypes'
import { ApiRequestError } from '@/lib/apiErrors'
import { labelSinisterStatus, formatDate } from '@/lib/claimFormat'
import { canCreateClaim } from '@/lib/roleAccess'

export default function ClaimsTab() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady } = useAuth()
  const [rows, setRows] = useState([] as SinisterRow[])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetchSinisters({ limit: 50, offset: 0 })
      setRows(res.data)
    } catch (e) {
      const msg = e instanceof ApiRequestError ? e.message : 'Impossible de charger les sinistres.'
      setError(msg)
      setRows([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      setLoading(true)
      void load()
    }, [user, load])
  )

  const onRefresh = () => {
    setRefreshing(true)
    void load()
  }

  if (!user) return null

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <Text variant="headlineSmall" style={{ fontWeight: '700', marginBottom: 4 }}>
            Sinistres
          </Text>
        </View>

        {error ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        ) : null}

        {loading && rows.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => String(item.id)}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}
              >
                Aucun sinistre pour l’instant.
              </Text>
            }
            renderItem={({ item }) => {
              return (
                <Card
                  style={{ marginBottom: 12 }}
                  mode="elevated"
                  onPress={() => router.push(`/claim/${item.id}` as Href)}
                >
                  <Card.Content>
                    <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 4 }}>
                      {item.vehicle_plate}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                    >
                      Sinistre : {formatDate(item.incident_datetime)}
                    </Text>
                    <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                      {labelSinisterStatus(item.status)}
                    </Text>
                  </Card.Content>
                </Card>
              )
            }}
          />
        )}
        {canCreateClaim(user.role) ? (
          <FAB
            icon="plus"
            label="Nouveau"
            color="#fff"
            style={{
              position: 'absolute',
              right: 16,
              bottom: 16,
              backgroundColor: theme.colors.primary
            }}
            onPress={() => router.push('/claim/create' as Href)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  )
}
