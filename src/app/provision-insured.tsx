import { useCallback, useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, HelperText, Switch, Text, TextInput, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/auth'
import { provisionInsuredUser } from '@/api'
import { ApiRequestError } from '@/api/errors'
import { canProvisionInsuredAccount } from '@/utils/roleAccess'
import { setScreenFeedback } from '@/utils/screenFeedback'

/**
 * Création fiche assuré (POST /api/users/insured-provision) — rôles autorisés : admin, gestionnaire, chargé de clientèle.
 */
export default function ProvisionInsuredScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sendWelcome, setSendWelcome] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allowed = user != null && canProvisionInsuredAccount(user.role)

  useEffect(() => {
    if (!isReady) return
    if (user && !canProvisionInsuredAccount(user.role)) {
      router.replace('/home')
    }
  }, [isReady, user, router])

  const onSubmit = useCallback(async () => {
    setError(null)
    const u = username.trim()
    const em = email.trim()
    if (!u || !em) {
      setError("L'identifiant (username) et l'e-mail sont obligatoires.")
      return
    }
    setLoading(true)
    try {
      const res = await provisionInsuredUser({
        username: u,
        email: em,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        send_welcome_email: sendWelcome
      })
      const id = res.data?.id
      setScreenFeedback({ message: res.message ?? 'Fiche assuré créée.' })
      if (id != null) {
        router.replace(`/user/${id}`)
      } else {
        router.replace('/insured-users')
      }
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Création impossible'
      )
    } finally {
      setLoading(false)
    }
  }, [username, email, firstName, lastName, sendWelcome, router])

  if (!isReady || !user) {
    return null
  }
  if (!allowed) {
    return null
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="titleMedium" style={{ marginBottom: 8, fontWeight: '600' }}>
            Nouvel assuré
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}
          >
            Création d’une fiche (sans mot de passe). Vous pourrez envoyer l’e-mail d’accès plus tard
            si besoin.
          </Text>

          <TextInput
            label="Identifiant (username) *"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label="E-mail *"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
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

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginVertical: 8,
              paddingVertical: 4
            }}
          >
            <Text style={{ flex: 1, marginRight: 12 }}>Envoyer l’e-mail d’accès (1er connexion)</Text>
            <Switch value={sendWelcome} onValueChange={setSendWelcome} />
          </View>

          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={() => void onSubmit()}
            loading={loading}
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            Créer la fiche
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
