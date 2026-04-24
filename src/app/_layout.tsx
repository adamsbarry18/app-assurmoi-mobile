import { LogBox } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-reanimated'
import { AuthProvider } from '@/auth'
import { assurMoiLightTheme } from '@/constants/theme'

if (__DEV__) {
  LogBox.ignoreLogs([
    'props.pointerEvents is deprecated',
    'props.pointerEvents is deprecated. Use style.pointerEvents'
  ])
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={assurMoiLightTheme}>
          <AuthProvider>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: assurMoiLightTheme.colors.background },
                /** Évite le libellé « (main) » (nom du groupe Expo Router) sur le bouton retour iOS */
                headerBackButtonDisplayMode: 'minimal',
                headerBackTitle: ''
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
              <Stack.Screen
                name="forgot-password"
                options={{
                  title: 'Mot de passe oublié',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary
                }}
              />
              <Stack.Screen
                name="reset-password"
                options={{
                  title: 'Nouveau mot de passe',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerBackTitle: 'Connexion'
                }}
              />
              <Stack.Screen
                name="admin-users"
                options={{
                  title: 'Équipe',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="insured-users"
                options={{
                  title: 'Assurés',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="provision-insured"
                options={{
                  title: 'Nouvel assuré',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerShadowVisible: false,
                  headerBackTitle: 'Retour'
                }}
              />
              <Stack.Screen
                name="user/[id]"
                options={{
                  title: 'Fiche utilisateur',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerShadowVisible: false,
                  headerBackTitle: 'Retour'
                }}
              />
              <Stack.Screen
                name="profile"
                options={{
                  title: 'Mon profil',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.primary },
                  headerTintColor: assurMoiLightTheme.colors.onPrimary,
                  headerBackTitle: 'Accueil',
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="claim/create"
                options={{
                  title: 'Nouveau sinistre',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.surface },
                  headerTintColor: assurMoiLightTheme.colors.primary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="claim/[id]"
                options={{
                  title: 'Sinistre',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.surface },
                  headerTintColor: assurMoiLightTheme.colors.primary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="folder/[id]"
                options={{
                  title: 'Dossier',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.surface },
                  headerTintColor: assurMoiLightTheme.colors.primary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="history"
                options={{
                  title: 'Historique',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.surface },
                  headerTintColor: assurMoiLightTheme.colors.primary,
                  headerShadowVisible: false
                }}
              />
              <Stack.Screen
                name="document/[id]"
                options={{
                  title: 'Document',
                  headerStyle: { backgroundColor: assurMoiLightTheme.colors.surface },
                  headerTintColor: assurMoiLightTheme.colors.primary,
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
