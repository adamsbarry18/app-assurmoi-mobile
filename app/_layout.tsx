import { LogBox } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from '@/node_modules/expo-status-bar/build/StatusBar'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { AuthProvider } from '@/features/auth'
import { assurMoiLightTheme } from '@/constants/theme'

if (__DEV__) {
  LogBox.ignoreLogs([
    'props.pointerEvents is deprecated',
    'props.pointerEvents is deprecated. Use style.pointerEvents'
  ])
}

export default function RootLayout () {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={assurMoiLightTheme}>
          <AuthProvider>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: assurMoiLightTheme.colors.background }
              }}
            >
              <Stack.Screen
                name="index"
                options={{ headerShown: false, animation: 'none' }}
              />
              <Stack.Screen
                name="login"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="(main)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="forgot-password"
                options={{
                  title: 'Mot de passe oublié',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary
                }}
              />
              <Stack.Screen
                name="admin-users"
                options={{
                  title: 'Utilisateurs',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="admin-user-create"
                options={{
                  title: 'Nouvel utilisateur',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="admin-user/[id]"
                options={{
                  title: 'Fiche utilisateur',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerBackTitle: 'Liste',
                  headerShadowVisible: false
                }}
              />
            </Stack>
            <StatusBar style="light" />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
