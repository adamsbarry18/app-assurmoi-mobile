import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native'
import { useFocusEffect, useNavigation, useRouter, type Href } from 'expo-router'
import {
  ActivityIndicator,
  DataTable,
  FAB,
  IconButton,
  Searchbar,
  Snackbar,
  Text,
  useTheme
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { ApiRequestError } from '@/lib/api'
import { consumeScreenFeedback } from '@/lib/screenFeedback'
import { listUsers } from '@/lib/usersApi'
import { roleLabel } from '@/lib/roleAccess'
import type { AuthUser } from '@/lib/auth/types'
import { BrandColors } from '@/constants/brand'

const PAGE_SIZE = 8
/** Délai après la dernière frappe avant appel API (recherche instantanée) */
const SEARCH_DEBOUNCE_MS = 280
/** Marge horizontale commune (recherche + tableau) */
const SCREEN_H_PAD = 20
const CELL_H_PAD = 8

function formatUserCell (u: AuthUser): string {
  if (u.first_name || u.last_name) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ')
  }
  return u.username
}

export default function AdminUsers () {
  const theme = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const { user, logout, isReady } = useAuth()
  const { width } = useWindowDimensions()
  /** Largeur utile = écran moins les marges latérales. */
  const tableWidth = Math.max(0, width - 2 * SCREEN_H_PAD)

  const [rows, setRows] = useState<AuthUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  /** Filtre API (débouncé) */
  const [search, setSearch] = useState('')
  /** Texte saisi en direct dans la barre */
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [tableBusy, setTableBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listSnack, setListSnack] = useState<string | null>(null)
  const isFirstListLoad = useRef(true)
  /** Un seul effet de debounce au 1er rendu : ne pas forcer `page=0` (pagination possible avant la fin du délai). */
  const isFirstSearchDebounce = useRef(true)

  const numberOfPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1)
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(total, (page + 1) * PAGE_SIZE)

  const fetchUsers = useCallback(
    async (mode: 'list' | 'refresh') => {
      setError(null)
      if (mode === 'refresh') {
        setRefreshing(true)
      } else if (isFirstListLoad.current) {
        setLoading(true)
      } else {
        setTableBusy(true)
      }
      try {
        const res = await listUsers({
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          search: search.trim() || undefined
        })
        setRows(res.data)
        setTotal(res.meta.total)
      } catch (e) {
        const msg =
          e instanceof ApiRequestError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Erreur inconnue'
        setError(msg)
        setRows([])
        setTotal(0)
      } finally {
        setLoading(false)
        setTableBusy(false)
        setRefreshing(false)
        isFirstListLoad.current = false
      }
    },
    [page, search]
  )

  useEffect(() => {
    if (!isReady || !user) return
    if (user.role !== 'ADMIN') {
      router.replace('/home')
    }
  }, [isReady, user, router])

  /** Recherche instantanée : filtre API après le dernier caractère (debounce). */
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = searchInput.trim()
      setSearch(q)
      if (!isFirstSearchDebounce.current) {
        setPage(0)
      }
      isFirstSearchDebounce.current = false
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  useFocusEffect(
    useCallback(() => {
      if (!isReady || user?.role !== 'ADMIN') return
      const feedback = consumeScreenFeedback()
      if (feedback?.message) {
        setListSnack(feedback.message)
      }
      void fetchUsers('list')
    }, [isReady, user?.role, fetchUsers])
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Utilisateurs',
      headerBackTitle: 'Accueil',
      headerRight: () => (
        <IconButton
          icon="logout"
          iconColor="#fff"
          onPress={() => {
            void (async () => {
              await logout()
              router.replace('/login')
            })()
          }}
        />
      )
    })
  }, [navigation, logout, router])

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <View style={{ flex: 1, paddingHorizontal: SCREEN_H_PAD, paddingTop: 12 }}>
        <View style={{ marginBottom: 12 }}>
          <Searchbar
            placeholder="Rechercher"
            value={searchInput}
            onChangeText={setSearchInput}
            style={{ borderRadius: 12, elevation: 0 }}
          />
          {searchInput.trim() !== search && (
            <Text variant="labelSmall" style={{ marginTop: 6, opacity: 0.55, paddingLeft: 4 }}>
              Saisie en cours…
            </Text>
          )}
        </View>

        {error && !loading && (
          <View style={{ paddingBottom: 12 }}>
            <Text style={{ color: theme.colors.error, marginBottom: 4 }}>{error}</Text>
          </View>
        )}

        {loading && (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={{ marginTop: 8, opacity: 0.7 }}>Chargement…</Text>
          </View>
        )}

        {!loading && (
          <View style={{ flex: 1, position: 'relative' }}>
            {tableBusy && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 2,
                  padding: 8,
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }}
              >
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
            <ScrollView
            contentContainerStyle={{ minWidth: tableWidth, paddingBottom: 8 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void fetchUsers('refresh')}
              />
            }
          >
            <DataTable
              style={{ width: tableWidth, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' }}
            >
              <DataTable.Header
                style={{ backgroundColor: theme.colors.primaryContainer, borderBottomWidth: 0 }}
              >
                <DataTable.Title
                  textStyle={{ fontWeight: '700', color: theme.colors.onPrimaryContainer, fontSize: 13 }}
                  style={{ flex: 1, minWidth: 100, paddingLeft: CELL_H_PAD, paddingRight: 4 }}
                >
                  Utilisateur
                </DataTable.Title>
                <DataTable.Title
                  textStyle={{ fontWeight: '700', color: theme.colors.onPrimaryContainer, fontSize: 13 }}
                  style={{ flex: 1.2, minWidth: 120, paddingHorizontal: 4 }}
                >
                  Rôle
                </DataTable.Title>
                <DataTable.Title
                  textStyle={{ fontWeight: '700', color: theme.colors.onPrimaryContainer, fontSize: 13 }}
                  style={{ width: 88, minWidth: 88, maxWidth: 88, flex: 0, paddingRight: CELL_H_PAD, paddingLeft: 4 }}
                >
                  Statut
                </DataTable.Title>
              </DataTable.Header>
              {rows.length === 0 ? (
                <DataTable.Row>
                  <DataTable.Cell style={{ paddingVertical: 20, paddingHorizontal: CELL_H_PAD }}>
                    <Text style={{ opacity: 0.6 }}>Aucun résultat.</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ) : (
                rows.map((item) => (
                  <DataTable.Row
                    key={item.id}
                    onPress={() => router.push(`/admin-user/${item.id}` as Href)}
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(15, 23, 42, 0.06)'
                    }}
                  >
                    <DataTable.Cell
                      textStyle={{ fontSize: 14, fontWeight: '500' }}
                      style={{
                        flex: 1,
                        minWidth: 100,
                        paddingLeft: CELL_H_PAD,
                        paddingRight: 4,
                        paddingVertical: 10
                      }}
                    >
                      {formatUserCell(item)}
                    </DataTable.Cell>
                    <DataTable.Cell
                      textStyle={{ fontSize: 12.5 }}
                      style={{
                        flex: 1.2,
                        minWidth: 120,
                        flexWrap: 'wrap',
                        paddingHorizontal: 4,
                        paddingVertical: 10
                      }}
                    >
                      {roleLabel(item.role)}
                    </DataTable.Cell>
                    <DataTable.Cell
                      style={{
                        width: 88,
                        minWidth: 88,
                        maxWidth: 88,
                        flex: 0,
                        paddingRight: CELL_H_PAD,
                        paddingLeft: 4,
                        paddingVertical: 10
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: item.is_active
                            ? 'rgba(0, 105, 92, 0.12)'
                            : 'rgba(183, 28, 28, 0.12)',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                          alignSelf: 'flex-start'
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: item.is_active ? '#00695C' : theme.colors.error
                          }}
                        >
                          {item.is_active ? 'actif' : 'inactif'}
                        </Text>
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              )}

              <DataTable.Pagination
                page={page}
                numberOfPages={numberOfPages}
                onPageChange={setPage}
                label={total === 0 ? '0 enregistrement' : `${from} – ${to} sur ${total}`}
                showFastPaginationControls
                style={{ backgroundColor: theme.colors.surfaceVariant }}
              />
            </DataTable>
            </ScrollView>
          </View>
        )}
      </View>

      <Snackbar
        visible={!!listSnack}
        onDismiss={() => setListSnack(null)}
        duration={4000}
        action={{ label: 'OK', onPress: () => setListSnack(null) }}
        style={{ backgroundColor: theme.colors.inverseSurface }}
      >
        <Text style={{ color: theme.colors.inverseOnSurface }}>{listSnack}</Text>
      </Snackbar>

      <FAB
        icon="account-plus"
        style={{
          position: 'absolute',
          right: SCREEN_H_PAD,
          bottom: 16,
          backgroundColor: theme.colors.primaryContainer
        }}
        onPress={() => router.push('/admin-user-create' as Href)}
        color={BrandColors.primary}
        label="Créer"
      />
    </SafeAreaView>
  )
}
