import { Pressable, Text, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from 'react-native-paper'
import { useNotificationInbox } from '@/features/notification/NotificationInboxContext'
import { useNotificationPanel } from '@/features/notification/NotificationPanelContext'

type Props = {
  /** `onPrimary` : icône claire sur fond dégradé (accueil / plus) */
  variant?: 'default' | 'onPrimary'
}

export function NotificationHeaderButton({ variant = 'default' }: Props) {
  const theme = useTheme()
  const { unreadCount } = useNotificationInbox()
  const { open } = useNotificationPanel()
  const iconColor = variant === 'onPrimary' ? '#fff' : theme.colors.onSurface
  const showBadge = unreadCount > 0
  const label = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Pressable
      onPress={open}
      hitSlop={10}
      style={({ pressed }) => ({
        padding: 8,
        marginRight: variant === 'onPrimary' ? 0 : 4,
        opacity: pressed ? 0.75 : 1
      })}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir les alertes"
      accessibilityHint={
        showBadge
          ? `${unreadCount} alerte${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
          : 'Aucune alerte non lue'
      }
    >
      <View>
        <MaterialCommunityIcons name="bell-outline" size={24} color={iconColor} />
        {showBadge ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: theme.colors.error,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}
