import { useCallback, useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { resetPasswordRequest } from '@/api/auth.api'
import { ApiRequestError } from '@/api/errors'
import { setScreenFeedback } from '@/utils/screenFeedback'
import { BrandColors } from '@/constants/brand'

function extractTokenFromInput(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  const m = /[?&]token=([^&\s#]+)/.exec(t)
  if (m) {
    try {
      return decodeURIComponent(m[1])
    } catch {
      return m[1]
    }
  }
  return t
}

export default function ResetPasswordScreen() {
  const theme = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ token?: string }>()

  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw = params.token
    const fromLink = Array.isArray(raw) ? raw[0] : raw
    if (fromLink) {
      try {
        setToken(decodeURIComponent(fromLink))
      } catch {
        setToken(fromLink)
      }
    }
  }, [params.token])

  const onSubmit = useCallback(async () => {
    setError(null)
    const tok = extractTokenFromInput(token)
    if (!tok) {
      setError('Jeton manquant : ouvrez le lien reçu par e-mail ou collez-le ci-dessous.')
      return
    }
    const pw = password.trim()
    const pw2 = passwordConfirm.trim()
    if (pw.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (pw !== pw2) {
      setError('Le mot de passe et la confirmation ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      await resetPasswordRequest(tok, pw)
      setScreenFeedback({
        message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.'
      })
      router.replace('/login')
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Réinitialisation impossible'
      )
    } finally {
      setLoading(false)
    }
  }, [token, password, passwordConfirm, router])

  const rawParam = params.token
  const hasTokenFromUrl = Boolean((Array.isArray(rawParam) ? rawParam[0] : rawParam)?.length)

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
            Nouveau mot de passe
          </Text>
          <Text
            variant="bodyMedium"
            style={{ marginBottom: 16, lineHeight: 22, color: theme.colors.onSurfaceVariant }}
          >
            Choisissez un mot de passe sécurisé. Si vous avez ouvert cette page depuis l’e-mail, le
            jeton est déjà pris en compte.
          </Text>

          {!hasTokenFromUrl ? (
            <View style={{ marginBottom: 12 }}>
              <TextInput
                label="Lien ou jeton (collé depuis l’e-mail)"
                value={token}
                onChangeText={setToken}
                mode="outlined"
                multiline
                numberOfLines={3}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ marginBottom: 8 }}
              />
              <HelperText type="info" padding="none">
                Vous pouvez coller l’URL complète ou seulement le long jeton après « token= ».
              </HelperText>
            </View>
          ) : null}

          <TextInput
            label="Nouveau mot de passe (8 car. min.)"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={{ marginTop: 8 }}
          />
          <TextInput
            label="Confirmer le mot de passe"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            mode="outlined"
            secureTextEntry
            style={{ marginTop: 8 }}
          />

          {error ? (
            <HelperText type="error" visible style={{ marginTop: 8 }}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={() => void onSubmit()}
            loading={loading}
            disabled={loading}
            style={{ marginTop: 20, borderRadius: 10 }}
            buttonColor={BrandColors.primary}
          >
            Enregistrer le mot de passe
          </Button>

          <Button mode="text" onPress={() => router.replace('/login')} style={{ marginTop: 12 }}>
            Retour à la connexion
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
