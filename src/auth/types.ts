/** Profil utilisateur renvoyé par l’API (hors secrets) */
export type AuthUser = {
  id: number
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  is_active: boolean
  /** Tant que l’assuré n’a pas défini son mot de passe (compte provisionné). */
  password_pending?: boolean
  created_at?: string
  updated_at?: string
}

/** Ligne « invitation en attente » dans la liste admin (GET /api/users) */
export type ListInvitationRow = {
  kind: 'invitation'
  id: number
  email: string
  role: string
  status: string
  username: null
  first_name: null
  last_name: null
  is_active: null
  created_at?: string
  updated_at?: string
}

export type ListUserRowUser = AuthUser & { kind: 'user' }
export type ListUserRow = ListUserRowUser | ListInvitationRow

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
