import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Card, Divider, Text, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/auth'
import { ApiRequestError } from '@/api/errors'
import { canListUsers, roleLabel } from '@/utils/roleAccess'
import { fetchUserById } from '@/api'
import type { AuthUser } from '@/auth/types'

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  } catch {
    return iso
  }
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme()
  return (
    <View style={{ marginBottom: 14 }}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
        {value || '—'}
      </Text>
    </View>
  )
}

export default function UserDetailScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { id: idParam } = useLocalSearchParams<{ id: string }>()
  const { user: me, isReady } = useAuth()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const id = Number.parseInt(String(idParam), 10)

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) {
      setError('Identifiant invalide.')
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetchUserById(id)
      setUser(res.data)
    } catch (e) {
      setUser(null)
      setError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Chargement impossible'
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!isReady) return
    if (!me) {
      router.replace('/login')
      return
    }
    const ownOnly = !canListUsers(me.role)
    if (ownOnly && Number(me.id) !== id) {
      router.replace('/home')
      return
    }
    void load()
  }, [isReady, me, id, load, router])

  if (!me || (!canListUsers(me.role) && Number(me.id) !== id)) {
    return null
  }

  const statusLabel = user
    ? user.password_pending
      ? 'Premier accès en attente (mot de passe non défini)'
      : user.is_active
        ? 'Actif'
        : 'Inactif'
    : ''

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      {loading ? (
        <View style={{ padding: 32, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 12, opacity: 0.7 }}>Chargement…</Text>
        </View>
      ) : error ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: theme.colors.error, marginBottom: 16 }}>{error}</Text>
          <Pressable onPress={() => void load()}>
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Réessayer</Text>
          </Pressable>
        </View>
      ) : user ? (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Card mode="elevated" style={{ borderRadius: 16, backgroundColor: theme.colors.surface }}>
            <Card.Title title="Informations du compte" titleVariant="titleMedium" />
            <Card.Content>
              <Row label="Identifiant" value={user.username} />
              <Row label="E-mail" value={user.email} />
              <Row
                label="Nom complet"
                value={[user.first_name, user.last_name].filter(Boolean).join(' ').trim() || '—'}
              />
              <Row label="Rôle" value={roleLabel(user.role)} />
              <Row label="Statut" value={statusLabel} />
              <Divider style={{ marginVertical: 8 }} />
              <Row label="N° compte" value={String(user.id)} />
              {user.created_at ? <Row label="Créé le" value={formatDate(user.created_at)} /> : null}
              {user.updated_at ? (
                <Row label="Dernière mise à jour" value={formatDate(user.updated_at)} />
              ) : null}
            </Card.Content>
          </Card>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}
