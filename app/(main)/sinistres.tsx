import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, Text, useTheme } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { roleLabel } from '@/lib/roleAccess'
import { useEffect } from 'react'

/**
 * Placeholder : liste / création de sinistres (brancher sur `GET/POST /api/sinisters`).
 */
export default function SinistresTab () {
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
          Sinistres
        </Text>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 24 }}>
          Votre rôle : <Text style={{ fontWeight: '600' }}>{roleLabel(user.role)}</Text>. Les flux
          déclaration, validation et suivi seront rattachés ici (API sinistres).
        </Text>
        <Button mode="contained" style={{ marginTop: 20 }} onPress={() => router.push('/home')}>
          Retour à l’accueil
        </Button>
      </View>
    </SafeAreaView>
  )
}
