import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { roleLabel } from '@/lib/roleAccess'
import { useEffect } from 'react'

/**
 * Placeholder : dossiers de prise en charge (`/api/folders`).
 */
export default function DossiersTab () {
  const theme = useTheme()
  const router = useRouter()
  const { user, isReady } = useAuth()

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  if (!user) return null

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['left', 'right', 'bottom']}
    >
      <View style={{ padding: 20 }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700', marginBottom: 8 }}>
          Dossiers
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 24 }}>
          Suivi des étapes, expertise et prise en charge. Rôle :{' '}
          <Text style={{ fontWeight: '600' }}>{roleLabel(user.role)}</Text>. Connexion des écrans à
          l’API folders à venir.
        </Text>
        <Button mode="contained" style={{ marginTop: 20 }} onPress={() => router.push('/home')}>
          Retour à l’accueil
        </Button>
      </View>
    </SafeAreaView>
  )
}
