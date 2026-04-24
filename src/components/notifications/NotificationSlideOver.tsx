import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
  View
} from 'react-native'
import { useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNotificationPanel } from '@/notifications'
import { NotificationInboxPanelContent } from '@/components/notifications/NotificationInboxPanelContent'

export function NotificationSlideOver() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { width: W, height: H } = useWindowDimensions()
  const { isOpen, close, dismiss, registerAnimatedClose } = useNotificationPanel()
  const panelW = Math.min(400, Math.floor(W * 0.92))
  const translateX = useRef(new Animated.Value(Dimensions.get('window').width)).current
  const panelWRef = useRef(panelW)
  if (panelWRef.current !== panelW) {
    panelWRef.current = panelW
  }

  useLayoutEffect(() => {
    if (!isOpen) {
      registerAnimatedClose(null)
      return
    }
    registerAnimatedClose(() => {
      const w = panelWRef.current
      Animated.timing(translateX, {
        toValue: w,
        duration: 250,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) dismiss()
      })
    })
    return () => {
      registerAnimatedClose(null)
    }
  }, [isOpen, translateX, dismiss, registerAnimatedClose])

  useEffect(() => {
    if (!isOpen) return
    translateX.setValue(panelW)
    const id = requestAnimationFrame(() => {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true
      }).start()
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen, panelW, translateX])

  useEffect(() => {
    if (!isOpen || Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close()
      return true
    })
    return () => sub.remove()
  }, [isOpen, close])

  if (!isOpen) {
    return null
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.45)'
          }}
          onPress={close}
          accessibilityLabel="Fermer les alertes"
        />
        <Animated.View
          style={{
            width: panelW,
            minHeight: H,
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOffset: { width: -4, height: 0 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 8
          }}
        >
          <NotificationInboxPanelContent active={isOpen} />
        </Animated.View>
      </View>
    </Modal>
  )
}
