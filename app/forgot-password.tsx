import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { forgotPasswordRequest } from '@/lib/auth/authApi'
import { ApiRequestError } from '@/lib/api'

export default function ForgotPassword () {
  const theme = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit () {
    setError(null)
    const e = email.trim()
    if (!e) {
      setError('Indiquez votre adresse e-mail.')
      return
    }
    setLoading(true)
    try {
      await forgotPasswordRequest(e)
      setDone(true)
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Envoi impossible'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text variant="bodyMedium" style={{ marginBottom: 16, lineHeight: 22 }}>
            Saisissez l’adresse e-mail de votre compte. Si un compte existe, vous recevrez les
            instructions pour réinitialiser votre mot de passe.
          </Text>

          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            left={<TextInput.Icon icon="email-outline" />}
            disabled={done}
          />
          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}

          {done ? (
            <Text style={{ marginTop: 16, color: theme.colors.secondary }}>
              Si un compte correspond à cet e-mail, un message a été envoyé. Vérifiez votre boîte
              de réception.
            </Text>
          ) : (
            <Button
              mode="contained"
              onPress={() => void onSubmit()}
              loading={loading}
              disabled={loading}
              style={{ marginTop: 20 }}
            >
              Envoyer
            </Button>
          )}

          <Button mode="text" onPress={() => router.replace('/login')} style={{ marginTop: 16 }}>
            Retour à la connexion
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
