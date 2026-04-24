import { useEffect, useCallback } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { type Href, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, Text, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/auth'
import { useNotificationPanel } from '@/notifications'
import { NotificationHeaderButton } from '@/components/notifications/NotificationHeaderButton'
import { getQuickActions, type QuickAction } from '@/utils/dashboardConfig'
import { roleLabel } from '@/utils/roleAccess'
import { BrandColors } from '@/constants/brand'
import type { AuthUser } from '@/auth/types'

function getInitials(u: AuthUser): string {
  if (u.first_name?.trim() || u.last_name?.trim()) {
    const a = (u.first_name?.trim()?.[0] ?? '').toUpperCase()
    const b = (u.last_name?.trim()?.[0] ?? '').toUpperCase()
    if (a && b) return `${a}${b}`
    if (a) return a + (a.length < 2 ? (u.last_name?.[0] ?? u.username[0] ?? '') : '')
  }
  return (u.username || '?').slice(0, 2).toUpperCase()
}

function getDisplayName(u: AuthUser): string {
  if (u.first_name || u.last_name) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  }
  return u.username
}

type MenuRowProps = {
  title: string
  subtitle?: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconBg: string
  iconColor: string
  onPress?: () => void
  disabled?: boolean
  showChevron?: boolean
}

function MenuRow({
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  onPress,
  disabled,
  showChevron
}: MenuRowProps) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14
        }}
      >
        <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron && !disabled && (
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.outline} />
      )}
    </Pressable>
  )
}

type SectionCardProps = {
  title: string
  children: React.ReactNode
}

function SectionCard({ title, children }: SectionCardProps) {
  const theme = useTheme()
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(15, 23, 42, 0.06)',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
      }}
    >
      <Text
        variant="labelLarge"
        style={{
          color: theme.colors.onSurfaceVariant,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          fontWeight: '600',
          marginBottom: 4,
          fontSize: 12
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

export default function MoreTab() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user, logout, isReady } = useAuth()
  const { open: openNotifications } = useNotificationPanel()

  useEffect(() => {
    if (isReady && !user) router.replace('/login')
  }, [isReady, user, router])

  const onQuickAction = useCallback(
    (a: QuickAction) => {
      if (a.href) {
        router.push(a.href as Href)
        return
      }
      if (a.tab === 'claims') router.push('/claims' as Href)
      else if (a.tab === 'folders') router.push('/folders' as Href)
    },
    [router]
  )

  if (!user) return null

  const name = getDisplayName(user)
  const initials = getInitials(user)
  const primaryC = theme.colors.primary
  const containerC = theme.colors.primaryContainer
  const quickActions = getQuickActions(user.role)

  const actionSubtitle: Record<string, string | undefined> = {
    'team-users': 'Comptes collaborateur (hors assurés) et invitations associées',
    'insured-users': 'Fiches assurés, invitations assuré, e-mail 1er accès',
    'new-insured': 'Créer la fiche assuré (e-mail 1er accès depuis la liste, au moment voulu)',
    claims: 'Espace sinistres et déclarations',
    folders: 'Dossiers de prise en charge',
    'my-claims': 'Suivi de vos déclarations',
    'my-folders': 'Vos dossiers de prise en charge',
    'folders-tracking': 'Dossiers dont vous avez le suivi'
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant }}>
      <LinearGradient
        colors={[...BrandColors.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 80,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14
          }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.8,
              textTransform: 'uppercase'
            }}
          >
            Mon profil
          </Text>
          <NotificationHeaderButton variant="onPrimary" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(255,255,255,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.45)'
            }}
          >
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700' }}>{initials}</Text>
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text
              variant="titleLarge"
              style={{ color: '#fff', fontWeight: '700' }}
              numberOfLines={2}
            >
              {name}
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 14,
                marginTop: 4
              }}
              numberOfLines={1}
            >
              {user.email}
            </Text>
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: 10,
                backgroundColor: 'rgba(255,255,255,0.22)',
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                {roleLabel(user.role)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ marginTop: -56 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionCard title="Navigation">
          <MenuRow
            title="Alertes"
            subtitle="Rappels, validations et échéances"
            icon="bell-outline"
            iconBg={containerC}
            iconColor={primaryC}
            onPress={openNotifications}
            showChevron
          />
          {quickActions.length === 0 ? (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
            >
              Aucun raccourci pour votre rôle. Utilisez les onglets en bas d’écran.
            </Text>
          ) : null}
          {quickActions.map((a) => (
            <MenuRow
              key={a.id}
              title={a.label}
              subtitle={actionSubtitle[a.id]}
              icon={a.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              iconBg={containerC}
              iconColor={primaryC}
              onPress={() => onQuickAction(a)}
              showChevron
            />
          ))}
        </SectionCard>

        <SectionCard title="Compte & application">
          <MenuRow
            title="Mon profil"
            subtitle="Nom, prénom, mot de passe"
            icon="account-edit-outline"
            iconBg={containerC}
            iconColor={primaryC}
            onPress={() => router.push('/profile')}
            showChevron
          />
          <MenuRow
            title="Paramètres"
            subtitle="Langue, sécurité — bientôt"
            icon="cog-outline"
            iconBg={theme.colors.surfaceVariant}
            iconColor={theme.colors.outline}
            disabled
            showChevron={false}
          />
        </SectionCard>

        <View style={{ marginHorizontal: 20, marginTop: 4 }}>
          <Button
            mode="outlined"
            onPress={() => {
              void (async () => {
                await logout()
                router.replace('/login')
              })()
            }}
            icon="logout"
            textColor={theme.colors.error}
            style={{ borderRadius: 12, borderColor: 'rgba(183, 28, 28, 0.35)' }}
            contentStyle={{ height: 48 }}
            labelStyle={{ fontSize: 15, fontWeight: '600' }}
          >
            Se déconnecter
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}
