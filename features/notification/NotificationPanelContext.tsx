import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

type Ctx = {
  isOpen: boolean
  open: () => void
  /**
   * Ferme le panneau (animation si le slide-over a enregistré un handler).
   */
  close: () => void
  /**
   * Fermeture immédiate (état) — appeler à la fin de l’animation de sortie.
   */
  dismiss: () => void
  registerAnimatedClose: (fn: (() => void) | null) => void
}

const NotificationPanelContext = createContext<Ctx | null>(null)

export function NotificationPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const closeRef = useRef<(() => void) | null>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const dismiss = useCallback(() => setIsOpen(false), [])

  const close = useCallback(() => {
    if (closeRef.current) {
      closeRef.current()
    } else {
      setIsOpen(false)
    }
  }, [])

  const registerAnimatedClose = useCallback((fn: (() => void) | null) => {
    closeRef.current = fn
  }, [])

  const value = useMemo<Ctx>(
    () => ({ isOpen, open, close, dismiss, registerAnimatedClose }),
    [isOpen, open, close, dismiss, registerAnimatedClose]
  )

  return (
    <NotificationPanelContext.Provider value={value}>{children}</NotificationPanelContext.Provider>
  )
}

export function useNotificationPanel(): Ctx {
  const v = useContext(NotificationPanelContext)
  if (!v) {
    throw new Error('useNotificationPanel : enveloppez l’arbre avec <NotificationPanelProvider>')
  }
  return v
}
