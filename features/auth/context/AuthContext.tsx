import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/auth/tokenStorage'
import { loginRequest, logoutRequest, meRequest, refreshRequest } from '@/lib/auth/authApi'
import type { AuthUser } from '@/lib/auth/types'

type AuthContextValue = {
  user: AuthUser | null
  isReady: boolean
  isSubmitting: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refreshSession = useCallback(async () => {
    const access = await getAccessToken()
    const refresh = await getRefreshToken()

    if (!access || !refresh) {
      setUser(null)
      return
    }

    try {
      setUser(await meRequest(access))
      return
    } catch {
      /* jeton d’accès expiré ou invalide : tentative de rafraîchissement */
    }

    try {
      const tokens = await refreshRequest(refresh)
      await setTokens(tokens.accessToken, tokens.refreshToken)
      setUser(await meRequest(tokens.accessToken))
    } catch {
      await clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refreshSession()
      } finally {
        if (!cancelled) setIsReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true)
    try {
      const res = await loginRequest(email.trim(), password)
      await setTokens(res.accessToken, res.refreshToken)
      setUser(res.user)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const access = await getAccessToken()
    try {
      if (access) {
        await logoutRequest(access)
      }
    } catch {
      /* déconnexion locale même si l’API échoue */
    } finally {
      await clearTokens()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isSubmitting,
      login,
      logout,
      refreshSession
    }),
    [user, isReady, isSubmitting, login, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return ctx
}
