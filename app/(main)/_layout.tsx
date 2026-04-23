import { Redirect, Tabs } from 'expo-router'
import { View } from 'react-native'
import { ActivityIndicator, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/features/auth'
import { NotificationInboxProvider } from '@/features/notification/NotificationInboxContext'
import { NotificationPanelProvider } from '@/features/notification/NotificationPanelContext'
import { NotificationHeaderButton } from '@/components/notifications/NotificationHeaderButton'
import { NotificationSlideOver } from '@/components/notifications/NotificationSlideOver'
import { BrandColors } from '@/constants/brand'

function MainTabScreens() {
  const theme = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTitleStyle: { fontWeight: '600', color: theme.colors.onSurface },
        headerShadowVisible: false,
        headerRight: () => <NotificationHeaderButton />,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E8ECF0',
          paddingTop: 4,
          height: 60
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          headerShown: false,
          headerRight: undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: 'Sinistres',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="alert-octagon-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="folders"
        options={{
          title: 'Dossiers',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder-text-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Plus',
          headerShown: false,
          headerRight: undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
          )
        }}
      />
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
