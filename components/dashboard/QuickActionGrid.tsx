import { Pressable, View, useWindowDimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, useTheme } from 'react-native-paper'
import type { QuickAction } from '@/lib/dashboardConfig'

const COL_GAP = 12
const MAX_COLS = 2

type Props = {
  actions: QuickAction[]
  onAction: (action: QuickAction) => void
}

export function QuickActionGrid ({ actions, onAction }: Props) {
  const theme = useTheme()
  const { width } = useWindowDimensions()
  const padding = 4
  const inner = width - 32 - padding * 2
  const tileW = (inner - COL_GAP) / MAX_COLS

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: COL_GAP
      }}
    >
      {actions.map((a) => (
        <Pressable
          key={a.id}
          onPress={() => onAction(a)}
          style={({ pressed }) => ({
            width: tileW,
            minHeight: 100,
            borderRadius: 14,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            paddingVertical: 16,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 3,
            elevation: 2
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: theme.colors.primaryContainer,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8
            }}
          >
            <MaterialCommunityIcons
              // noms issus de lib/dashboardConfig (MaterialCommunityIcons)
              name={a.icon as never}
              size={26}
              color={theme.colors.primary}
            />
          </View>
          <Text
            variant="labelLarge"
            style={{ textAlign: 'center', color: theme.colors.onSurface }}
            numberOfLines={2}
          >
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
