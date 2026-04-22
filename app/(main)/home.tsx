import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { type Href, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Button, IconButton, Menu, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/features/auth'
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid'
import { getHeroCopy, getQuickActions, type QuickAction } from '@/lib/dashboardConfig'
import { canListUsers, roleLabel } from '@/lib/roleAccess'
import { BrandColors } from '@/constants/brand'

export default function HomeDashboard () {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, isReady } = useAuth()
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      router.replace('/login')
    }
  }, [isReady, user, router])

  const onQuickAction = (a: QuickAction) => {
    if (a.href) {
      router.push(a.href as Href)
      return
    }
    if (a.tab === 'sinistres') router.push('/sinistres')
    if (a.tab === 'dossiers') router.push('/dossiers')
  }

  const runActionAndCloseMenu = (a: QuickAction) => {
    setActionsMenuOpen(false)
    onQuickAction(a)
  }

  if (!user) {
    return null
  }

  const firstName = user.first_name?.trim() || user.username
  const hero = getHeroCopy(user.role)
  const quickActions = getQuickActions(user.role)

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={[...BrandColors.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 28,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4
          }}
        >
          <Text
            variant="headlineSmall"
            style={{ color: '#fff', fontWeight: '700', flex: 1, paddingRight: 8 }}
          >
            Bienvenue {firstName}
          </Text>
          <Menu
            visible={actionsMenuOpen}
            onDismiss={() => setActionsMenuOpen(false)}
            anchorPosition="bottom"
            contentStyle={{ minWidth: 256 }}
            anchor={
              <IconButton
                icon="menu"
                iconColor="#fff"
                size={26}
                onPress={() => setActionsMenuOpen(true)}
                style={{
                  margin: 0,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  borderRadius: 22
                }}
                accessibilityLabel="Menu des actions"
              />
            }
          >
            {quickActions.map((a) => (
              <Menu.Item
                key={a.id}
                title={a.label}
                leadingIcon={a.icon}
                onPress={() => runActionAndCloseMenu(a)}
              />
            ))}
          </Menu>
        </View>
        <Text
          style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize: 14,
            lineHeight: 20
          }}
        >
          {user.email} · {roleLabel(user.role)}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: theme.colors.primaryContainer,
            borderRadius: 16,
            padding: 18,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(13, 71, 161, 0.12)'
          }}
        >
          <Text
            variant="labelLarge"
            style={{ color: theme.colors.primary, marginBottom: 6, fontWeight: '600' }}
          >
            Pour vous, en ce moment
          </Text>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, marginBottom: 8, fontWeight: '600' }}
          >
            {hero.title}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            {hero.subtitle}
          </Text>
          {hero.ctaLabel && (hero.ctaHref || hero.ctaTab) ? (
            <Button
              mode="contained"
              onPress={() => {
                if (hero.ctaHref) router.push(hero.ctaHref as Href)
                else if (hero.ctaTab === 'sinistres') router.push('/sinistres')
                else if (hero.ctaTab === 'dossiers') router.push('/dossiers')
              }}
              style={{ marginTop: 16, borderRadius: 10 }}
              buttonColor={BrandColors.primary}
            >
              {hero.ctaLabel}
            </Button>
          ) : null}
        </View>

        <Text
          variant="titleMedium"
          style={{ marginBottom: 12, color: theme.colors.onSurface, fontWeight: '600' }}
        >
          Accès rapides
        </Text>
        <QuickActionGrid actions={quickActions} onAction={onQuickAction} />

        {canListUsers(user.role) && (
          <Button
            mode="outlined"
            icon="account-supervisor"
            onPress={() => router.push('/admin-users')}
            style={{ marginTop: 20, borderRadius: 10, borderColor: theme.colors.outline }}
          >
            Gestion des utilisateurs
          </Button>
        )}
      </ScrollView>
    </View>
  )
}
