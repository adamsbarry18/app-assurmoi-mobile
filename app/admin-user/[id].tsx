import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'
import {
  Button,
  Card,
  Dialog,
  HelperText,
  Portal,
  Snackbar,
  Switch,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RolePicker } from '@/components/RolePicker'
import { useAuth } from '@/features/auth'
import { ApiRequestError } from '@/lib/api'
import { setScreenFeedback } from '@/lib/screenFeedback'
import {
  deactivateUserApi,
  deleteUserApi,
  getUserById,
  updateUser
} from '@/lib/usersApi'
import { type UserRole } from '@/lib/roleAccess'
import type { AuthUser } from '@/lib/auth/types'
import { BrandColors } from '@/constants/brand'

function displayName (u: AuthUser): string {
  if (u.first_name || u.last_name) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  }
  return u.username
}

export default function AdminUserDetail () {
  const { id: idParam } = useLocalSearchParams<{ id: string }>()
  const theme = useTheme()
  const navigation = useNavigation()
  const router = useRouter()
  const { user: me, isReady } = useAuth()

  const id = Number.parseInt(String(idParam), 10)
  const isSelf = me?.id === id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [row, setRow] = useState<AuthUser | null>(null)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<UserRole>('INSURED')
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [snack, setSnack] = useState<{ text: string; isError: boolean } | null>(null)
  const [deactivateDialog, setDeactivateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const showSnack = (text: string, isError = false) => {
    setSnack({ text, isError })
  }

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setErr('Identifiant invalide')
      setLoading(false)
      return
    }
    setErr(null)
    setLoading(true)
    try {
      const res = await getUserById(id)
      const u = res.data
      setRow(u)
      setUsername(u.username)
      setEmail(u.email)
      setFirstName(u.first_name ?? '')
      setLastName(u.last_name ?? '')
      setRole(u.role as UserRole)
      setIsActive(u.is_active)
      setPassword('')
      setPasswordConfirm('')
    } catch (e) {
      setErr(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Chargement impossible'
      )
      setRow(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!isReady || me?.role !== 'ADMIN') {
      if (isReady && me && me.role !== 'ADMIN') router.replace('/home')
      return
    }
    void load()
  }, [isReady, me, load, router])

  useLayoutEffect(() => {
    if (row) {
      navigation.setOptions({ title: displayName(row) })
    }
  }, [navigation, row])

  const onSave = async () => {
    if (!id || !row) return
    setErr(null)
    setSaving(true)
    try {
      const body: {
        username: string
        email: string
        first_name: string | null
        last_name: string | null
        role: string
        is_active: boolean
        password?: string
      } = {
        username: username.trim(),
        email: email.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        role,
        is_active: isActive
      }
      const pw = password.trim()
      const pw2 = passwordConfirm.trim()
      if (pw.length > 0 || pw2.length > 0) {
        if (pw.length === 0 || pw2.length === 0) {
          const m = 'Renseignez le mot de passe et la confirmation, ou laissez les deux vides.'
          setErr(m)
          showSnack(m, true)
          setSaving(false)
          return
        }
        if (pw.length < 8) {
          const m = 'Le mot de passe doit faire au moins 8 caractères.'
          setErr(m)
          showSnack(m, true)
          setSaving(false)
          return
        }
        if (pw !== pw2) {
          const m = 'Le mot de passe et la confirmation ne correspondent pas.'
          setErr(m)
          showSnack(m, true)
          setSaving(false)
          return
        }
        body.password = pw
      }
      await updateUser(id, body)
      setPassword('')
      setPasswordConfirm('')
      setErr(null)
      setScreenFeedback({ message: 'Utilisateur mis à jour.' })
      router.replace('/admin-users')
    } catch (e) {
      const m =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Enregistrement impossible'
      setErr(m)
      showSnack(m, true)
    } finally {
      setSaving(false)
    }
  }

  const runDeactivate = async () => {
    if (!id || isSelf || !isActive) return
    setDeactivateDialog(false)
    try {
      const res = await deactivateUserApi(id)
      setRow(res.data)
      setIsActive(res.data.is_active)
      showSnack('Compte désactivé.', false)
    } catch (e) {
      const m = e instanceof ApiRequestError ? e.message : 'Action impossible'
      setErr(m)
      showSnack(m, true)
    }
  }

  const runDelete = async () => {
    if (!id || isSelf) return
    setDeleteDialog(false)
    try {
      await deleteUserApi(id)
      setScreenFeedback({ message: 'Utilisateur supprimé.' })
      router.replace('/admin-users')
    } catch (e) {
      const m = e instanceof ApiRequestError ? e.message : 'Suppression impossible'
      setErr(m)
      showSnack(m, true)
    }
  }

  if (!isReady || me?.role !== 'ADMIN') {
    return null
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement…</Text>
      </View>
    )
  }

  if (err && !row) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
        <Text style={{ color: theme.colors.error, marginBottom: 16 }}>{err}</Text>
        <Button onPress={() => void load()}>Réessayer</Button>
        <Button style={{ marginTop: 8 }} onPress={() => router.back()}>
          Retour
        </Button>
      </SafeAreaView>
    )
  }

  if (!row) return null

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {isSelf && (
          <View
            style={{
              backgroundColor: theme.colors.primaryContainer,
              padding: 12,
              borderRadius: 12,
              marginBottom: 16
            }}
          >
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              C’est votre compte : la suppression n’est pas proposée ici. Vous pouvez quand même
              modifier vos informations.
            </Text>
          </View>
        )}

        {err && (
          <Text style={{ color: theme.colors.error, marginBottom: 12 }}>{err}</Text>
        )}

        <Card style={{ borderRadius: 16, backgroundColor: '#fff' }} mode="elevated">
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.colors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.primary }}>
                  {displayName(row).slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleLarge" style={{ fontWeight: '700' }}>
                  {displayName(row)}
                </Text>
                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                  ID {row.id}
                </Text>
              </View>
            </View>

            <TextInput
              label="Identifiant"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              mode="outlined"
              style={{ marginBottom: 8 }}
            />

            <RolePicker value={role} onChange={setRole} label="Rôle" style={{ marginBottom: 8 }} />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}
            >
              <Text>Compte actif</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
            {isSelf && !isActive && (
              <HelperText type="error" style={{ marginBottom: 8 }}>
                Attention : un compte inactif ne peut plus se connecter.
              </HelperText>
            )}

            <TextInput
              label="Nouveau mot de passe (optionnel, 8 car. min.)"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Confirmer le mot de passe"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              mode="outlined"
              secureTextEntry
              style={{ marginBottom: 4 }}
            />
            <HelperText type="info" style={{ marginBottom: 8 }}>
              Si vous changez le mot de passe, les deux champs doivent correspondre.
            </HelperText>

            <Button
              mode="contained"
              onPress={() => void onSave()}
              loading={saving}
              disabled={saving}
              style={{ marginTop: 20, borderRadius: 10 }}
              buttonColor={BrandColors.primary}
            >
              Enregistrer
            </Button>
          </Card.Content>
        </Card>

        <View style={{ marginTop: 20, gap: 10 }}>
          {!isSelf && isActive && (
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              onPress={() => setDeactivateDialog(true)}
            >
              Désactiver le compte
            </Button>
          )}
          {!isSelf && (
            <Button mode="outlined" textColor={theme.colors.error} onPress={() => setDeleteDialog(true)}>
              Supprimer définitivement
            </Button>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deactivateDialog}
          onDismiss={() => setDeactivateDialog(false)}
          theme={{ roundness: 4 }}
        >
          <Dialog.Title>Désactiver le compte</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Cet utilisateur ne pourra plus se connecter. Confirmer la désactivation ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeactivateDialog(false)}>Annuler</Button>
            <Button textColor={theme.colors.error} onPress={() => void runDeactivate()}>
              Désactiver
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteDialog} onDismiss={() => setDeleteDialog(false)} theme={{ roundness: 4 }}>
          <Dialog.Title>Supprimer définitivement</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Cette action est irréversible. L’utilisateur et ses données liées côté application pourront être
              affectés selon la politique du serveur. Confirmer la suppression ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog(false)}>Annuler</Button>
            <Button textColor={theme.colors.error} onPress={() => void runDelete()}>
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/** Snackbar dans le portail (surtout web) : au-dessus du contenu, sans être masqué par le scroll / la carte. */}
        <Snackbar
          visible={!!snack}
          onDismiss={() => setSnack(null)}
          duration={snack?.isError ? 5000 : 3000}
          action={{ label: 'OK', onPress: () => setSnack(null) }}
          style={
            snack?.isError
              ? { backgroundColor: theme.colors.error }
              : { backgroundColor: theme.colors.inverseSurface }
          }
        >
          <Text
            style={{
              color: snack?.isError ? theme.colors.onError : theme.colors.inverseOnSurface
            }}
          >
            {snack?.text ?? ''}
          </Text>
        </Snackbar>
      </Portal>
    </SafeAreaView>
  )
}
