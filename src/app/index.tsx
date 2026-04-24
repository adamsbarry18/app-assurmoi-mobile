import { useEffect } from 'react'
import { View } from 'react-native'
import { ActivityIndicator, useTheme } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '@/auth'

/**
 * Point d’entrée « / » : restaure la session puis redirige.
 */
export default function Index() {
  const { user, isReady } = useAuth()
  const router = useRouter()
  const theme = useTheme()

  useEffect(() => {
    if (!isReady) return
    if (user) {
      router.replace('/home')
    } else {
      router.replace('/login')
    }
  }, [isReady, user, router])

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return null
}
