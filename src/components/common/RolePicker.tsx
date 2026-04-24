import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Menu, Text, TextInput, useTheme } from 'react-native-paper'
import { roleLabel, USER_ROLES, type UserRole } from '@/utils/roleAccess'

type RolePickerProps = {
  value: UserRole
  onChange: (role: UserRole) => void
  label?: string
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  /**
   * `menu` : Menu Paper (défaut). Ne fonctionne pas correctement à l’intérieur d’un `Dialog` Paper (portails / touches).
   * `modal` : overlay React Native — à utiliser dans les modales d’invitation ou tout `Dialog` imbriqué.
   */
  presentation?: 'menu' | 'modal'
}

/**
 * Liste déroulante (Menu Paper ou overlay Modal) pour le rôle utilisateur.
 */
export function RolePicker({
  value,
  onChange,
  label = 'Rôle',
  disabled = false,
  style,
  presentation = 'menu'
}: RolePickerProps) {
  const [open, setOpen] = useState(false)
  const theme = useTheme()
  /** Pas de `TextInput.Icon` ici : sur le web c’est un `<button>` dans le `Pressable` (aussi bouton) → hydratation cassée. */
  const chevron = (
    <View style={{ justifyContent: 'center', marginRight: 4, pointerEvents: 'box-none' }}>
      <MaterialCommunityIcons name="chevron-down" size={22} color={theme.colors.onSurfaceVariant} />
    </View>
  )

  const field = (
    <Pressable
      onPress={() => {
        if (!disabled) setOpen(true)
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, expanded: open }}
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      <View>
        <TextInput
          label={label}
          value={roleLabel(value)}
          mode="outlined"
          editable={false}
          pointerEvents="none"
          right={chevron}
        />
      </View>
    </Pressable>
  )

  if (presentation === 'modal') {
    return (
      <View style={style}>
        {field}
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
          statusBarTranslucent
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
              onPress={() => setOpen(false)}
            />
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant
                }
              ]}
            >
              <Text variant="titleSmall" style={{ marginBottom: 8, color: theme.colors.onSurface }}>
                {label.replace(/\s*\*$/, '')}
              </Text>
              <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
                {USER_ROLES.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => {
                      onChange(r)
                      setOpen(false)
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.colors.outlineVariant
                      }
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: r === value ? '700' : '400',
                        color: theme.colors.onSurface
                      }}
                    >
                      {roleLabel(r)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    )
  }

  return (
    <View style={style}>
      <Menu visible={open} onDismiss={() => setOpen(false)} anchor={field}>
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

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '72%',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    zIndex: 1,
    elevation: 6
  },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 4
  }
})
