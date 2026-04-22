import type { ApiWelcomePayload } from '@/lib/api'

/** Rôles alignés sur le modèle API / cahier des charges */
export const USER_ROLES = [
  'ADMIN',
  'PORTFOLIO_MANAGER',
  'TRACKING_OFFICER',
  'CUSTOMER_OFFICER',
  'INSURED'
] as const

export type UserRole = (typeof USER_ROLES)[number]

const labels: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  PORTFOLIO_MANAGER: 'Gestionnaire de portefeuille',
  TRACKING_OFFICER: 'Chargé de suivi',
  CUSTOMER_OFFICER: 'Chargé de clientèle',
  INSURED: 'Assuré'
}

export function roleLabel (role: string): string {
  return labels[role as UserRole] ?? role
}

/** Visibilité des liens API (cohérent avec `requireRoles` sur chaque route). */
export function canListUsers (role: string): boolean {
  return role === 'ADMIN'
}

export function canAccessStaffSinistersAndFolders (role: string): boolean {
  return (
    role === 'ADMIN' ||
    role === 'PORTFOLIO_MANAGER' ||
    role === 'TRACKING_OFFICER' ||
    role === 'CUSTOMER_OFFICER'
  )
}

export function canAccessDocumentsAndHistory (role: string): boolean {
  return canAccessStaffSinistersAndFolders(role)
}

/** Notifications : tout utilisateur authentifié (route sans filtre de rôle). */
export function canAccessNotifications (_role: string): boolean {
  return true
}

export type HomeApiLinkKey =
  | 'docs'
  | 'auth'
  | 'users'
  | 'sinisters'
  | 'documents'
  | 'folders'
  | 'history'
  | 'notifications'

export function allowedApiLinkKeys (role: string): Set<HomeApiLinkKey> {
  const keys = new Set<HomeApiLinkKey>()
  keys.add('docs')
  keys.add('auth')
  if (canListUsers(role)) keys.add('users')
  if (canAccessStaffSinistersAndFolders(role)) {
    keys.add('sinisters')
    keys.add('documents')
    keys.add('folders')
    keys.add('history')
  }
  if (canAccessNotifications(role)) keys.add('notifications')
  return keys
}

const linkMeta: Record<
  HomeApiLinkKey,
  { label: string }
> = {
  docs: { label: 'Documentation (Swagger)' },
  auth: { label: 'Authentification' },
  users: { label: 'Utilisateurs (API)' },
  sinisters: { label: 'Sinistres' },
  documents: { label: 'Documents' },
  folders: { label: 'Dossiers' },
  history: { label: 'Historique' },
  notifications: { label: 'Notifications' }
}

export function getFilteredApiLinks (
  role: string,
  data: ApiWelcomePayload
): { label: string; path: string }[] {
  const allowed = allowedApiLinkKeys(role)
  const order: HomeApiLinkKey[] = [
    'docs',
    'auth',
    'users',
    'sinisters',
    'documents',
    'folders',
    'history',
    'notifications'
  ]
  const out: { label: string; path: string }[] = []
  for (const key of order) {
    if (!allowed.has(key)) continue
    const path = data[key]
    if (typeof path !== 'string' || !path) continue
    out.push({ label: linkMeta[key].label, path })
  }
  return out
}
