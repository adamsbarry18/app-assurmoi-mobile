import { useState } from 'react'
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Menu, TextInput, useTheme } from 'react-native-paper'
import { roleLabel, USER_ROLES, type UserRole } from '@/lib/roleAccess'

type RolePickerProps = {
  value: UserRole
  onChange: (role: UserRole) => void
  label?: string
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * Liste déroulante (Menu Paper + champ en lecture seule) pour le rôle utilisateur.
 */
export function RolePicker ({
  value,
  onChange,
  label = 'Rôle',
  disabled = false,
  style
}: RolePickerProps) {
  const [open, setOpen] = useState(false)
  const theme = useTheme()
  /** Pas de `TextInput.Icon` ici : sur le web c’est un `<button>` dans le `Pressable` (aussi bouton) → hydratation cassée. */
  const chevron = (
    <View style={{ justifyContent: 'center', marginRight: 4, pointerEvents: 'box-none' }}>
      <MaterialCommunityIcons
        name="chevron-down"
        size={22}
        color={theme.colors.onSurfaceVariant}
      />
    </View>
  )

  return (
    <View style={style}>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Pressable
            onPress={() => {
              if (!disabled) setOpen(true)
            }}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            style={{ opacity: disabled ? 0.55 : 1 }}
          >
            <View style={{ pointerEvents: 'box-none' }}>
              <TextInput
                label={label}
                value={roleLabel(value)}
                mode="outlined"
                editable={false}
                right={chevron}
              />
            </View>
          </Pressable>
        }
      >
        {USER_ROLES.map((r) => (
          <Menu.Item
            key={r}
            onPress={() => {
              onChange(r)
              setOpen(false)
            }}
            title={roleLabel(r)}
            titleStyle={r === value ? { fontWeight: '700' } : undefined}
          />
        ))}
      </Menu>
    </View>
  )
}
