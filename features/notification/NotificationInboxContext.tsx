import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { useAuth } from '@/features/auth'
import { fetchUnreadNotificationCount } from '@/lib/notificationsApi'

type Ctx = {
  unreadCount: number
  refresh: () => Promise<void>
}

const NotificationInboxContext = createContext<Ctx | null>(null)

export function NotificationInboxProvider({ children }: { children: ReactNode }) {
  const { user, isReady } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    try {
      const n = await fetchUnreadNotificationCount()
      setUnreadCount(n)
    } catch {
      setUnreadCount(0)
    }
  }, [user])

  useEffect(() => {
    if (!isReady || !user) return
    void refresh()
  }, [isReady, user, refresh])

  useEffect(() => {
    if (!user) return
    const t = setInterval(() => {
      void refresh()
    }, 60_000)
    return () => clearInterval(t)
  }, [user, refresh])

  const value = useMemo<Ctx>(() => ({ unreadCount, refresh }), [unreadCount, refresh])

  return (
    <NotificationInboxContext.Provider value={value}>{children}</NotificationInboxContext.Provider>
  )
}

export function useNotificationInbox(): Ctx {
  const v = useContext(NotificationInboxContext)
  if (!v) {
    throw new Error('useNotificationInbox : enveloppez l’arbre avec <NotificationInboxProvider>')
  }
  return v
}
