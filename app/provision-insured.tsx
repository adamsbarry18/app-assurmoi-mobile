import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { ApiRequestError } from '@/lib/api'
import { canProvisionInsuredAccount } from '@/lib/roleAccess'
import { setScreenFeedback } from '@/lib/screenFeedback'
import { provisionInsuredUser } from '@/lib/usersApi'
import { BrandColors } from '@/constants/brand'

export default function ProvisionInsuredScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!canProvisionInsuredAccount(user.role)) {
      router.replace('/home')
    }
  }, [isReady, user, router])

  async function onSubmit() {
    setError(null)
    const u = username.trim()
    const em = email.trim()
    if (!u || !em) {
      setError('Identifiant et e-mail sont requis.')
      return
    }
    setLoading(true)
    try {
      const res = await provisionInsuredUser({
        username: u,
        email: em,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        send_welcome_email: false
      })
      setScreenFeedback({ message: res.message })
      router.replace('/insured-users')
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
  }

  if (!user || !canProvisionInsuredAccount(user.role)) {
    return null
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}
        >
          <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 8 }}>
            Fiche assuré
          </Text>

          <TextInput
            label="Identifiant (connexion) *"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            style={{ marginBottom: 8 }}
            disabled={loading}
          />
          <TextInput
            label="E-mail *"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ marginBottom: 8 }}
            disabled={loading}
          />
          <TextInput
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            mode="outlined"
            style={{ marginBottom: 8 }}
            disabled={loading}
          />
          <TextInput
            label="Nom"
            value={lastName}
            onChangeText={setLastName}
            mode="outlined"
            disabled={loading}
          />

          {error ? (
            <HelperText type="error" visible style={{ marginTop: 4 }}>
              {error}
            </HelperText>
          ) : null}

          <View style={{ marginTop: 24, gap: 12 }}>
            <Button
              mode="contained"
              onPress={() => void onSubmit()}
              loading={loading}
              disabled={loading}
              buttonColor={BrandColors.primary}
            >
              Créer le compte
            </Button>
            <Button mode="outlined" onPress={() => router.back()} disabled={loading}>
              Annuler
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
