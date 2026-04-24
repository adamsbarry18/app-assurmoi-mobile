import { useCallback, useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Card, HelperText, Snackbar, Text, TextInput, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/auth'
import { ApiRequestError } from '@/api/errors'
import { roleLabel } from '@/utils/roleAccess'
import { updateUser } from '@/api'
import { BrandColors } from '@/constants/brand'

const fieldGap = { marginBottom: 14 }

export default function ProfileScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady, refreshSession } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      router.replace('/login')
      return
    }
    setFirstName(user.first_name ?? '')
    setLastName(user.last_name ?? '')
  }, [isReady, user, router])

  const onSave = useCallback(async () => {
    if (!user) return
    setError(null)
    const pw = password.trim()
    const pw2 = passwordConfirm.trim()
    if ((pw || pw2) && (pw.length < 8 || pw !== pw2)) {
      setError(
        pw.length < 8
          ? 'Le mot de passe doit faire au moins 8 caractères.'
          : 'Le mot de passe et la confirmation ne correspondent pas.'
      )
      return
    }
    if (pw && !pw2) {
      setError('Confirmez le nouveau mot de passe.')
      return
    }
    setSaving(true)
    try {
      const body: {
        first_name: string | null
        last_name: string | null
        password?: string
      } = {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null
      }
      if (pw) body.password = pw
      await updateUser(user.id, body)
      setPassword('')
      setPasswordConfirm('')
      await refreshSession()
      setSnack('Profil mis à jour.')
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Enregistrement impossible'
      )
    } finally {
      setSaving(false)
    }
  }, [user, firstName, lastName, password, passwordConfirm, refreshSession])

  if (!isReady || !user) {
    return null
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <HelperText type="error" visible style={{ marginBottom: 8 }}>
              {error}
            </HelperText>
          ) : null}

          <Card mode="elevated" style={{ borderRadius: 16, backgroundColor: '#fff' }}>
            <Card.Content style={{ paddingBottom: 8 }}>
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.primary, fontWeight: '600', marginBottom: 8 }}
              >
                Compte
              </Text>
              <TextInput
                label="Identifiant"
                value={user.username}
                mode="outlined"
                disabled
                style={fieldGap}
              />
              <TextInput
                label="E-mail"
                value={user.email}
                mode="outlined"
                disabled
                style={fieldGap}
              />
              <TextInput
                label="Rôle"
                value={roleLabel(user.role)}
                mode="outlined"
                disabled
                style={fieldGap}
              />

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.outlineVariant,
                  marginVertical: 8
                }}
              />

              <Text
                variant="titleSmall"
                style={{ color: theme.colors.primary, fontWeight: '600', marginBottom: 8 }}
              >
                Identité
              </Text>
              <TextInput
                label="Prénom"
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                style={fieldGap}
              />
              <TextInput
                label="Nom"
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                style={fieldGap}
              />

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.outlineVariant,
                  marginVertical: 8
                }}
              />

              <Text
                variant="titleSmall"
                style={{ color: theme.colors.primary, fontWeight: '600', marginBottom: 8 }}
              >
                Mot de passe
              </Text>
              <TextInput
                label="Nouveau mot de passe (8 car. min.)"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={fieldGap}
              />
              <TextInput
                label="Confirmer le mot de passe"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                mode="outlined"
                secureTextEntry
                style={fieldGap}
              />
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={() => void onSave()}
            loading={saving}
            disabled={saving}
            style={{ marginTop: 20, borderRadius: 12 }}
            buttonColor={BrandColors.primary}
            contentStyle={{ paddingVertical: 4 }}
          >
            Enregistrer
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnack(null) }}
        style={{ backgroundColor: theme.colors.inverseSurface }}
      >
        <Text style={{ color: theme.colors.inverseOnSurface }}>{snack}</Text>
      </Snackbar>
    </SafeAreaView>
  )
}
