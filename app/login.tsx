import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  Button,
  HelperText,
  Snackbar,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { BrandColors } from '@/constants/brand'
import { ApiRequestError } from '@/lib/api'

export default function Login () {
  const theme = useTheme()
  const router = useRouter()
  const { login, isSubmitting, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secure, setSecure] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snack, setSnack] = useState(false)

  useEffect(() => {
    if (user) {
      router.replace('/home')
    }
  }, [user, router])

  async function onSubmit () {
    setError(null)
    if (!email.trim() || !password) {
      setError('Renseignez l’e-mail (ou identifiant) et le mot de passe.')
      return
    }
    try {
      await login(email.trim(), password)
      router.replace('/home')
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Connexion impossible'
      setError(msg)
      setSnack(true)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <LinearGradient
            colors={[...BrandColors.gradient]}
            style={{
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 100,
              borderBottomLeftRadius: 28,
              borderBottomRightRadius: 28
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MaterialCommunityIcons name="shield-check" size={32} color="#fff" />
              </View>
            </View>
            <Text
              variant="headlineLarge"
              style={{ color: '#fff', fontWeight: '700', marginBottom: 6 }}
            >
              AssurMoi
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 320 }}
            >
              Votre espace assuré : suivi des dossiers, documents et protection au quotidien.
            </Text>
          </LinearGradient>

          <View
            style={{
              marginTop: -64,
              marginHorizontal: 16,
              marginBottom: 32,
              borderRadius: 16,
              backgroundColor: theme.colors.surface,
              elevation: 4,
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8
            }}
          >
            <Text variant="titleMedium" style={{ marginBottom: 4 }}>
              Connexion
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}
            >
              E-mail / identifiant et mot de passe
            </Text>

            <TextInput
              label="E-mail ou identifiant"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              left={<TextInput.Icon icon="account-outline" />}
            />
            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={secure}
              textContentType="password"
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={secure ? 'eye' : 'eye-off'}
                  onPress={() => setSecure(s => !s)}
                />
              }
              style={{ marginTop: 8 }}
            />
            {error ? (
              <HelperText type="error" visible style={{ marginTop: 4 }}>
                {error}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={() => void onSubmit()}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={{ marginTop: 16, borderRadius: 8 }}
              contentStyle={{ paddingVertical: 4 }}
            >
              Se connecter
            </Button>

            <Pressable
              onPress={() => router.push('/forgot-password')}
              style={{ marginTop: 16, marginBottom: 8 }}
            >
              <Text variant="bodySmall" style={{ color: theme.colors.primary, textAlign: 'center' }}>
                Mot de passe oublié ?
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snack}
        onDismiss={() => setSnack(false)}
        duration={4000}
        action={{ label: 'OK', onPress: () => setSnack(false) }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  )
}
