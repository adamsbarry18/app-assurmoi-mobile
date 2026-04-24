import { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, RefreshControl, View } from 'react-native'
import {
  ActivityIndicator,
  Card,
  IconButton,
  SegmentedButtons,
  Text,
  useTheme
} from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/auth'
import { useNotificationInbox, useNotificationPanel } from '@/notifications'
import { formatDate } from '@/utils/claimFormat'
import { fetchNotifications, markAllNotificationsRead, markNotificationAsRead } from '@/api'
import type { Notification } from '@/types/notification'
import { ApiRequestError } from '@/api/errors'

type Filter = 'all' | 'unread'

function channelLabel(c: string): string {
  if (c === 'PUSH') return 'App'
  if (c === 'EMAIL') return 'E-mail'
  return c
}

type Props = {
  /** true quand le panneau est affiché — déclenche le chargement */
  active: boolean
}

export function NotificationInboxPanelContent({ active }: Props) {
  const theme = useTheme()
  const { user } = useAuth()
  const { refresh: refreshBadge } = useNotificationInbox()
  const { close: closePanel } = useNotificationPanel()

  const [filter, setFilter] = useState<Filter>('unread')
  const [rows, setRows] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetchNotifications(
        filter === 'unread' ? { is_read: false, limit: 80, offset: 0 } : { limit: 80, offset: 0 }
      )
      setRows(res.data)
    } catch (e) {
      const msg = e instanceof ApiRequestError ? e.message : 'Impossible de charger les alertes.'
      setError(msg)
      setRows([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter])

  useEffect(() => {
    if (!active || !user) return
    setLoading(true)
    void load()
  }, [active, user, filter, load])

  useEffect(() => {
    if (active && user) void refreshBadge()
  }, [active, user, refreshBadge])

  const onMarkAllRead = useCallback(() => {
    if (marking) return
    void (async () => {
      setMarking(true)
      try {
        await markAllNotificationsRead()
        void refreshBadge()
        void load()
      } catch (e) {
        const msg = e instanceof ApiRequestError ? e.message : 'Action impossible pour le moment.'
        Alert.alert('Erreur', msg)
      } finally {
        setMarking(false)
      }
    })()
  }, [marking, refreshBadge, load])

  const onRefresh = () => {
    setRefreshing(true)
    void (async () => {
      await load()
      void refreshBadge()
    })()
  }

  const onRowPress = (item: Notification) => {
    if (item.is_read) return
    void (async () => {
      try {
        const res = await markNotificationAsRead(item.id)
        setRows((prev) => prev.map((n) => (n.id === item.id ? res.data : n)))
        void refreshBadge()
      } catch (e) {
        const msg = e instanceof ApiRequestError ? e.message : 'Mise à jour impossible.'
        Alert.alert('Erreur', msg)
      }
    })()
  }

  if (!user) return null

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 4,
          paddingRight: 4,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(15, 23, 42, 0.08)'
        }}
      >
        <IconButton
          icon="close"
          size={24}
          onPress={closePanel}
          accessibilityLabel="Fermer"
          style={{ margin: 0 }}
        />
        <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1, textAlign: 'center' }}>
          Alertes
        </Text>
        <Text
          onPress={marking ? undefined : onMarkAllRead}
          style={{
            color: marking ? theme.colors.outline : theme.colors.primary,
            fontWeight: '600',
            fontSize: 14,
            paddingVertical: 8,
            paddingHorizontal: 4,
            minWidth: 64,
            textAlign: 'right'
          }}
        >
          Tout lire
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 10 }}
        >
          Rappels de validation, échéances et messages importants.
        </Text>
        <SegmentedButtons
          value={filter}
          onValueChange={(v) => setFilter(v as Filter)}
          buttons={[
            { value: 'unread', label: 'Non lues' },
            { value: 'all', label: 'Toutes' }
          ]}
        />
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
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View
              style={{
                paddingVertical: 40,
                alignItems: 'center',
                paddingHorizontal: 8
              }}
            >
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={40}
                color={theme.colors.outline}
              />
              <Text
                variant="bodyLarge"
                style={{
                  marginTop: 12,
                  textAlign: 'center',
                  color: theme.colors.onSurfaceVariant
                }}
              >
                {filter === 'unread' ? 'Aucune alerte non lue.' : 'Aucune alerte pour le moment.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card
              mode="elevated"
              style={{ marginBottom: 10, backgroundColor: '#fff' }}
              onPress={() => onRowPress(item)}
            >
              <Card.Content>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 6
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                      marginRight: 8
                    }}
                  >
                    {!item.is_read ? (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.colors.primary,
                          marginRight: 8,
                          marginTop: 4
                        }}
                      />
                    ) : null}
                    <Text
                      variant="labelSmall"
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        textTransform: 'uppercase',
                        letterSpacing: 0.3
                      }}
                    >
                      {channelLabel(item.channel)} · {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={item.is_read ? 'email-open-outline' : 'email-mark-as-unread'}
                    size={20}
                    color={item.is_read ? theme.colors.outline : theme.colors.primary}
                  />
                </View>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: item.is_read ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
                    lineHeight: 22
                  }}
                >
                  {item.content?.trim() || '—'}
                </Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  )
}
