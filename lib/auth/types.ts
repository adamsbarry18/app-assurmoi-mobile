/** Profil utilisateur renvoyé par l’API (hors secrets) */
export type AuthUser = {
  id: number
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

export type RefreshResponse = {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export type MeResponse = {
  data: AuthUser
}
