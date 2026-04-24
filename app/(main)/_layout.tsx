import { Redirect, Tabs } from 'expo-router'
import { View } from 'react-native'
import { ActivityIndicator, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { NotificationInboxProvider } from '@/features/notification/NotificationInboxContext'
import { NotificationPanelProvider } from '@/features/notification/NotificationPanelContext'
import { NotificationHeaderButton } from '@/components/notifications/NotificationHeaderButton'
import { NotificationSlideOver } from '@/components/notifications/NotificationSlideOver'
import { BrandColors } from '@/constants/brand'

function MainTabScreens() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  /** Zone sûre basse (indicateur d’accueil, barre de navigation) — évite de couper les libellés. */
  const bottomInset = insets.bottom
  const tabContentMin = 50
  const tabBarHeight = tabContentMin + 4 + bottomInset

  return (
    <Tabs
      screenOptions={({ route }) => {
        const hideHeader = route.name === 'home' || route.name === 'more'
        return {
          headerShown: !hideHeader,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: { fontWeight: '600', color: theme.colors.onSurface },
          headerShadowVisible: false,
          headerRight:
            route.name !== 'home' && route.name !== 'more'
              ? () => <NotificationHeaderButton />
              : undefined,
          tabBarActiveTintColor: BrandColors.primary,
          tabBarInactiveTintColor: BrandColors.tabBarInactive,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarItemStyle: { paddingTop: 2, paddingBottom: 0 },
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: 'rgba(15, 23, 42, 0.08)',
            paddingTop: 4,
            paddingBottom: bottomInset,
            minHeight: tabBarHeight,
            height: tabBarHeight,
            elevation: 12,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.07,
            shadowRadius: 10
          },
          tabBarIcon: ({ focused, size }) => {
            const s = focused ? size + 1 : size
            const c = focused ? BrandColors.primary : BrandColors.tabBarInactive
            switch (route.name) {
              case 'home':
                return (
                  <MaterialCommunityIcons
                    name={focused ? 'home' : 'home-outline'}
                    size={s}
                    color={c}
                  />
                )
              case 'claims':
                return (
                  <MaterialCommunityIcons
                    name={focused ? 'alert-octagon' : 'alert-octagon-outline'}
                    size={s}
                    color={c}
                  />
                )
              case 'folders':
                return (
                  <MaterialCommunityIcons
                    name={focused ? 'folder-text' : 'folder-text-outline'}
                    size={s}
                    color={c}
                  />
                )
              case 'more':
                return <MaterialCommunityIcons name="dots-horizontal" size={s} color={c} />
              default:
                return null
            }
          }
        }
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="claims" options={{ title: 'Sinistres' }} />
      <Tabs.Screen name="folders" options={{ title: 'Dossiers' }} />
      <Tabs.Screen name="more" options={{ title: 'Plus' }} />
    </Tabs>
  )
}

export default function MainTabsLayout() {
  const { user, isReady } = useAuth()
  const theme = useTheme()

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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  return (
    <NotificationInboxProvider>
      <NotificationPanelProvider>
        <MainTabScreens />
        <NotificationSlideOver />
      </NotificationPanelProvider>
    </NotificationInboxProvider>
  )
}
