import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  HelperText,
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
import { type UserRole } from '@/lib/roleAccess'
import { createUser } from '@/lib/usersApi'
import { BrandColors } from '@/constants/brand'

const fieldGap = { marginBottom: 14 }

export default function AdminUserCreate () {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady } = useAuth()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<UserRole>('CUSTOMER_OFFICER')
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isReady || !user) return
    if (user.role !== 'ADMIN') {
      router.replace('/home')
    }
  }, [isReady, user, router])

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  const onSubmit = async () => {
    setError(null)
    if (password.trim().length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (password !== passwordConfirm) {
      setError('Le mot de passe et la confirmation ne correspondent pas.')
      return
    }
    setSubmitting(true)
    try {
      await createUser({
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        is_active: isActive
      })
      setScreenFeedback({ message: 'Utilisateur créé.' })
      router.replace('/admin-users')
    } catch (e) {
      setError(
        e instanceof ApiRequestError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Création impossible'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.onSurface, marginBottom: 6 }}>
          Nouvel utilisateur
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22, marginBottom: 20 }}
        >
          Renseignez les informations du compte. Tous les champs marqués d’un astérisque sont obligatoires.
        </Text>

        {error ? (
          <HelperText type="error" visible style={{ marginBottom: 12 }}>
            {error}
          </HelperText>
        ) : null}

        <Card
          mode="elevated"
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: 16
          }}
        >
          <Card.Content style={{ paddingBottom: 8 }}>
            <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: '600', marginBottom: 10 }}>
              Connexion
            </Text>
            <TextInput
              label="Identifiant *"
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              style={fieldGap}
            />
            <TextInput
              label="E-mail *"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={fieldGap}
            />
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.primary, fontWeight: '600', marginTop: 4, marginBottom: 10 }}
            >
              Mot de passe
            </Text>
            <TextInput
              label="Mot de passe * (8 car. min.)"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={fieldGap}
            />
            <TextInput
              label="Confirmer le mot de passe *"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              mode="outlined"
              secureTextEntry
              style={fieldGap}
            />
            <Text
              variant="titleSmall"
              style={{ color: theme.colors.primary, fontWeight: '600', marginTop: 4, marginBottom: 10 }}
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
              style={{ marginBottom: 4 }}
            />

            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.outlineVariant,
                marginVertical: 16
              }}
            />

            <Text
              variant="titleSmall"
              style={{ color: theme.colors.primary, fontWeight: '600', marginBottom: 10 }}
            >
              Rôle et accès
            </Text>
            <RolePicker label="Rôle *" value={role} onChange={setRole} style={{ marginBottom: 12 }} />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.colors.surfaceVariant
              }}
            >
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface, flex: 1, paddingRight: 12 }}>
                Compte actif
              </Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => void onSubmit()}
          loading={submitting}
          disabled={submitting}
          style={{ marginTop: 20, borderRadius: 12 }}
          contentStyle={{ paddingVertical: 6 }}
          buttonColor={BrandColors.primary}
        >
          Créer l’utilisateur
        </Button>
      </ScrollView>
    </SafeAreaView>
  )
}
