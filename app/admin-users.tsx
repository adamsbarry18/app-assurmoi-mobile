import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Alert, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native'
import { useFocusEffect, useNavigation, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Button,
  DataTable,
  Dialog,
  FAB,
  IconButton,
  Menu,
  Portal,
  Searchbar,
  Snackbar,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { ApiRequestError } from '@/lib/api'
import { consumeScreenFeedback } from '@/lib/screenFeedback'
import {
  activateUserApi,
  cancelInvitation,
  deactivateUserApi,
  listUsers,
  resendInvitation,
  sendInvite
} from '@/lib/usersApi'
import { roleLabel } from '@/lib/roleAccess'
import type { ListUserRow, ListInvitationRow, AuthUser } from '@/lib/auth/types'
import { type UserRole } from '@/lib/roleAccess'
import { BrandColors } from '@/constants/brand'
import { RolePicker } from '@/components/RolePicker'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 280
const SCREEN_H_PAD = 20
const CELL_H_PAD = 8

function formatUserCell(u: ListUserRow): string {
  if (u.kind === 'invitation') {
    return u.email
  }
  if (u.first_name || u.last_name) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ')
  }
  return u.username
}

function isUser(row: ListUserRow): row is AuthUser & { kind: 'user' } {
  return row.kind === 'user'
}

function isInvitation(row: ListUserRow): row is ListInvitationRow {
  return row.kind === 'invitation'
}

export default function AdminUsers() {
  const theme = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const { user, logout, isReady } = useAuth()
  const { width } = useWindowDimensions()
  const tableWidth = Math.max(0, width - 2 * SCREEN_H_PAD)

  const [rows, setRows] = useState<ListUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [tableBusy, setTableBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listSnack, setListSnack] = useState<string | null>(null)
  const isFirstListLoad = useRef(true)
  const isFirstSearchDebounce = useRef(true)

  const [menuKey, setMenuKey] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('INSURED')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)

  const numberOfPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1)
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min(total, (page + 1) * PAGE_SIZE)

  const closeInviteModal = useCallback(() => {
    if (inviteSubmitting) return
    setInviteOpen(false)
    setInviteError(null)
  }, [inviteSubmitting])

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

  const onDeactivateUser = (id: number) => {
    setMenuKey(null)
    setActionBusy(true)
    void (async () => {
      try {
        await deactivateUserApi(id)
        setListSnack('Compte désactivé.')
        await fetchUsers('list')
      } catch (e) {
        const m = e instanceof ApiRequestError ? e.message : 'Action impossible'
        Alert.alert('Erreur', m)
      } finally {
        setActionBusy(false)
      }
    })()
  }

  const onActivateUser = (id: number) => {
    setMenuKey(null)
    setActionBusy(true)
    void (async () => {
      try {
        await activateUserApi(id)
        setListSnack('Compte réactivé.')
        await fetchUsers('list')
      } catch (e) {
        const m = e instanceof ApiRequestError ? e.message : 'Action impossible'
        Alert.alert('Erreur', m)
      } finally {
        setActionBusy(false)
      }
    })()
  }

  const onResendInvite = (id: number) => {
    setMenuKey(null)
    setActionBusy(true)
    void (async () => {
      try {
        await resendInvitation(id)
        setListSnack('Invitation renvoyée.')
        await fetchUsers('list')
      } catch (e) {
        const m = e instanceof ApiRequestError ? e.message : 'Action impossible'
        Alert.alert('Erreur', m)
      } finally {
        setActionBusy(false)
      }
    })()
  }

  const onCancelInvite = (id: number) => {
    setMenuKey(null)
    Alert.alert('Annuler l’invitation', 'Le lien ne sera plus valide pour ce message.', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Annuler l’invitation',
        style: 'destructive',
        onPress: () => {
          setActionBusy(true)
          void (async () => {
            try {
              await cancelInvitation(id)
              setListSnack('Invitation annulée.')
              await fetchUsers('list')
            } catch (e) {
              const m = e instanceof ApiRequestError ? e.message : 'Action impossible'
              Alert.alert('Erreur', m)
            } finally {
              setActionBusy(false)
            }
          })()
        }
      }
    ])
  }

  const submitInvite = async () => {
    setInviteError(null)
    const em = inviteEmail.trim()
    if (!em) {
      setInviteError('Saisissez un e-mail.')
      return
    }
    setInviteSubmitting(true)
    try {
      await sendInvite({ email: em, role: inviteRole })
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('INSURED')
      setListSnack('Invitation envoyée.')
      await fetchUsers('list')
    } catch (e) {
      setInviteError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Envoi impossible'
      )
    } finally {
      setInviteSubmitting(false)
    }
  }

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
                style={{
                  width: tableWidth,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  overflow: 'hidden',
                  opacity: actionBusy ? 0.7 : 1
                }}
              >
                <DataTable.Header
                  style={{ backgroundColor: theme.colors.primaryContainer, borderBottomWidth: 0 }}
                >
                  <DataTable.Title
                    textStyle={{
                      fontWeight: '700',
                      color: theme.colors.onPrimaryContainer,
                      fontSize: 12
                    }}
                    style={{ flex: 1, minWidth: 72, paddingLeft: CELL_H_PAD, paddingRight: 4 }}
                  >
                    Utilisateur
                  </DataTable.Title>
                  <DataTable.Title
                    textStyle={{
                      fontWeight: '700',
                      color: theme.colors.onPrimaryContainer,
                      fontSize: 12
                    }}
                    style={{ flex: 0.9, minWidth: 80, paddingHorizontal: 2 }}
                  >
                    Rôle
                  </DataTable.Title>
                  <DataTable.Title
                    textStyle={{
                      fontWeight: '700',
                      color: theme.colors.onPrimaryContainer,
                      fontSize: 12
                    }}
                    style={{
                      width: 70,
                      minWidth: 64,
                      maxWidth: 70,
                      flex: 0,
                      paddingLeft: 2,
                      paddingRight: 2
                    }}
                  >
                    Statut
                  </DataTable.Title>
                  <DataTable.Title
                    textStyle={{
                      fontWeight: '700',
                      color: theme.colors.onPrimaryContainer,
                      fontSize: 11
                    }}
                    style={{
                      width: 72,
                      minWidth: 72,
                      maxWidth: 88,
                      flex: 0,
                      paddingRight: CELL_H_PAD
                    }}
                    accessibilityLabel="Actions sur la ligne"
                  >
                    Actions
                  </DataTable.Title>
                </DataTable.Header>
                {rows.length === 0 ? (
                  <DataTable.Row>
                    <DataTable.Cell style={{ paddingVertical: 20, paddingHorizontal: CELL_H_PAD }}>
                      <Text style={{ opacity: 0.6 }}>Aucun résultat.</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ) : (
                  rows.map((item) => {
                    const k = item.kind === 'user' ? `u-${item.id}` : `i-${item.id}`
                    const mKey = k
                    return (
                      <DataTable.Row
                        key={k}
                        style={{
                          borderBottomWidth: 1,
                          borderBottomColor: 'rgba(15, 23, 42, 0.06)'
                        }}
                      >
                        <DataTable.Cell
                          textStyle={{ fontSize: 12.5, fontWeight: '500' }}
                          style={{
                            flex: 1,
                            minWidth: 72,
                            paddingLeft: CELL_H_PAD,
                            paddingRight: 4,
                            paddingVertical: 8
                          }}
                        >
                          {formatUserCell(item)}
                        </DataTable.Cell>
                        <DataTable.Cell
                          textStyle={{ fontSize: 11.5 }}
                          style={{
                            flex: 0.9,
                            minWidth: 80,
                            paddingHorizontal: 2,
                            paddingVertical: 8
                          }}
                        >
                          {roleLabel(item.role)}
                        </DataTable.Cell>
                        <DataTable.Cell
                          style={{
                            width: 70,
                            minWidth: 64,
                            maxWidth: 70,
                            flex: 0,
                            paddingLeft: 2,
                            paddingRight: 2,
                            paddingVertical: 8
                          }}
                        >
                          {isInvitation(item) ? (
                            <View
                              style={{
                                backgroundColor: 'rgba(0, 87, 183, 0.12)',
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                borderRadius: 6,
                                alignSelf: 'flex-start'
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: '600',
                                  color: '#0057B7'
                                }}
                              >
                                en attente
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={{
                                backgroundColor: item.is_active
                                  ? 'rgba(0, 105, 92, 0.12)'
                                  : 'rgba(183, 28, 28, 0.12)',
                                paddingHorizontal: 6,
                                paddingVertical: 3,
                                borderRadius: 6,
                                alignSelf: 'flex-start'
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: '600',
                                  color: item.is_active ? '#00695C' : theme.colors.error
                                }}
                              >
                                {item.is_active ? 'actif' : 'inactif'}
                              </Text>
                            </View>
                          )}
                        </DataTable.Cell>
                        <DataTable.Cell
                          style={{
                            width: 72,
                            minWidth: 72,
                            maxWidth: 88,
                            flex: 0,
                            paddingRight: 4,
                            paddingVertical: 0,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          {(isUser(item) && user.id !== item.id) ||
                          (isInvitation(item) && item.status === 'pending') ? (
                            <Menu
                              visible={menuKey === mKey}
                              onDismiss={() => setMenuKey(null)}
                              anchor={
                                <IconButton
                                  icon="dots-vertical"
                                  size={20}
                                  style={{ margin: 0 }}
                                  onPress={() => setMenuKey(mKey === menuKey ? null : mKey)}
                                />
                              }
                            >
                              {isUser(item) && user.id !== item.id && item.is_active ? (
                                <Menu.Item
                                  onPress={() => {
                                    setMenuKey(null)
                                    Alert.alert(
                                      'Désactiver le compte',
                                      'Cet utilisateur ne pourra plus se connecter.',
                                      [
                                        { text: 'Retour', style: 'cancel' },
                                        {
                                          text: 'Désactiver',
                                          style: 'destructive',
                                          onPress: () => onDeactivateUser(item.id)
                                        }
                                      ]
                                    )
                                  }}
                                  title="Désactiver"
                                />
                              ) : null}
                              {isUser(item) && user.id !== item.id && !item.is_active ? (
                                <Menu.Item
                                  onPress={() => {
                                    setMenuKey(null)
                                    Alert.alert(
                                      'Réactiver le compte',
                                      'Cet utilisateur pourra de nouveau se connecter.',
                                      [
                                        { text: 'Retour', style: 'cancel' },
                                        {
                                          text: 'Réactiver',
                                          onPress: () => onActivateUser(item.id)
                                        }
                                      ]
                                    )
                                  }}
                                  title="Réactiver"
                                />
                              ) : null}
                              {isInvitation(item) && item.status === 'pending' ? (
                                <>
                                  <Menu.Item
                                    onPress={() => onResendInvite(item.id)}
                                    title="Renvoyer l’invitation"
                                  />
                                  <Menu.Item
                                    onPress={() => onCancelInvite(item.id)}
                                    title="Annuler l’invitation"
                                    titleStyle={{ color: theme.colors.error }}
                                  />
                                </>
                              ) : null}
                            </Menu>
                          ) : (
                            <View style={{ width: 48, height: 40 }} />
                          )}
                        </DataTable.Cell>
                      </DataTable.Row>
                    )
                  })
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
        icon="email-plus"
        style={{
          position: 'absolute',
          right: SCREEN_H_PAD,
          bottom: 16,
          backgroundColor: theme.colors.primaryContainer
        }}
        onPress={() => {
          setInviteError(null)
          setInviteOpen(true)
        }}
        color={BrandColors.primary}
        label="Inviter"
      />

      <Portal>
        <Dialog
          visible={inviteOpen}
          onDismiss={closeInviteModal}
          style={{ backgroundColor: theme.colors.background, borderRadius: 16 }}
        >
          <Dialog.Title>Inviter un membre</Dialog.Title>
          <Dialog.Content>
            {inviteError ? (
              <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{inviteError}</Text>
            ) : null}
            <TextInput
              label="E-mail *"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ marginBottom: 12 }}
            />
            <RolePicker
              label="Rôle *"
              value={inviteRole}
              onChange={setInviteRole}
              presentation="modal"
              style={{ marginBottom: 12 }}
            />
            <View
              style={{
                backgroundColor: 'rgba(0, 87, 183, 0.1)',
                borderRadius: 8,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8
              }}
            >
              <Text style={{ fontSize: 16 }}>✉</Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: theme.colors.onSurfaceVariant,
                  lineHeight: 20
                }}
              >
                Un e-mail d’invitation avec un lien pour finaliser le compte sera envoyé à cette
                adresse.
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeInviteModal} disabled={inviteSubmitting}>
              Annuler
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (inviteSubmitting) return
                void submitInvite()
              }}
              disabled={inviteSubmitting}
              loading={inviteSubmitting}
              buttonColor={BrandColors.primary}
            >
              Inviter
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}
