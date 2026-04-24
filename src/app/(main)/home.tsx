import { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { type Href, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Button, IconButton, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/auth'
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid'
import { NotificationHeaderButton } from '@/components/notifications/NotificationHeaderButton'
import { getHeroCopy, getQuickActions, type QuickAction } from '@/utils/dashboardConfig'
import { roleLabel } from '@/utils/roleAccess'
import { BrandColors } from '@/constants/brand'

export default function HomeDashboard() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, isReady } = useAuth()

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
    if (a.tab === 'claims') router.push('/claims' as Href)
    if (a.tab === 'folders') router.push('/folders' as Href)
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
            style={{ color: '#fff', fontWeight: '700', flex: 1, paddingRight: 8, flexWrap: 'wrap' }}
          >
            Bienvenue{' '}
            <Text style={{ color: BrandColors.welcomeName, fontWeight: '700' }}>{firstName}</Text>
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationHeaderButton variant="onPrimary" />
            <IconButton
              icon="account-circle"
              iconColor="#fff"
              size={28}
              onPress={() => router.push('/profile')}
              style={{
                margin: 0,
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderRadius: 22
              }}
              accessibilityLabel="Mon profil"
              accessibilityHint="Afficher et modifier vos informations"
            />
          </View>
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
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
          >
            {hero.subtitle}
          </Text>
          {hero.ctaLabel && (hero.ctaHref || hero.ctaTab) ? (
            <Button
              mode="contained"
              onPress={() => {
                if (hero.ctaHref) router.push(hero.ctaHref as Href)
                else if (hero.ctaTab === 'claims') router.push('/claims' as Href)
                else if (hero.ctaTab === 'folders') router.push('/folders' as Href)
              }}
              style={{ marginTop: 16, borderRadius: 10 }}
              buttonColor={BrandColors.primary}
            >
              {hero.ctaLabel}
            </Button>
          ) : null}
        </View>

        {quickActions.length > 0 ? (
          <>
            <Text
              variant="titleMedium"
              style={{ marginBottom: 12, color: theme.colors.onSurface, fontWeight: '600' }}
            >
              Accès rapides
            </Text>
            <QuickActionGrid actions={quickActions} onAction={onQuickAction} />
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}
