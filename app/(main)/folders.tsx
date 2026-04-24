import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, View } from 'react-native'
import { type Href, useRouter } from 'expo-router'
import { ActivityIndicator, Card, Text, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '@/features/auth'
import { fetchFolders } from '@/lib/claimsApi'
import type { FolderListRow } from '@/lib/claimsTypes'
import { ApiRequestError } from '@/lib/apiErrors'
import { labelFolderStatus, labelScenario, formatDate } from '@/lib/claimFormat'

export default function FoldersTab() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady } = useAuth()
  const [rows, setRows] = useState([] as FolderListRow[])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      /* Pas de filtre assigned_officer_id : le cahier prévoit « l’ensemble des dossiers » pour le
       * chargé de suivi ; l’API liste déjà tous les dossiers pour les rôles staff. */
      const res = await fetchFolders({
        limit: 50,
        offset: 0
      })
      setRows(res.data)
    } catch (e) {
      const msg = e instanceof ApiRequestError ? e.message : 'Impossible de charger les dossiers.'
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
            Dossiers
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
                Aucun dossier pour l’instant.
              </Text>
            }
            renderItem={({ item }) => (
              <Card
                style={{ marginBottom: 12 }}
                mode="elevated"
                onPress={() => router.push(`/folder/${item.id}` as Href)}
              >
                <Card.Content>
                  <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 4 }}>
                    {item.folder_reference ?? `Dossier #${item.id}`}
                  </Text>
                  {item.sinister ? (
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                    >
                      {item.sinister.vehicle_plate} · {formatDate(item.sinister.incident_datetime)}
                    </Text>
                  ) : null}
                  <Text
                    variant="labelMedium"
                    style={{ color: theme.colors.primary, marginBottom: 2 }}
                  >
                    {labelFolderStatus(item.status)}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                    {labelScenario(item.scenario)}
                  </Text>
                </Card.Content>
              </Card>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
