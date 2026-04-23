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

export function roleLabel(role: string): string {
  return labels[role as UserRole] ?? role
}

/** Visibilité des liens API (cohérent avec `requireRoles` sur chaque route). */
export function canListUsers(role: string): boolean {
  return role === 'ADMIN'
}

/** Création de déclaration (POST /api/sinisters) — aligné sur `ROLES_CREATE`. */
export function canCreateClaim(role: string): boolean {
  return role === 'ADMIN' || role === 'PORTFOLIO_MANAGER' || role === 'CUSTOMER_OFFICER'
}

/** Validation manager (PATCH /api/sinisters/:id/validate) — aligné sur `ROLES_VALIDATE`. */
export function canValidateClaim(role: string): boolean {
  return role === 'ADMIN' || role === 'PORTFOLIO_MANAGER'
}

/** Validation des pièces (PATCH /api/documents/:id/validate) — mêmes rôles que `canValidateClaim`. */
export const canValidateDocument: typeof canValidateClaim = canValidateClaim

/** Yousign (POST /api/documents/:id/sign) — aligné sur `ROLES_SIGN`. */
export function canRequestYousignSignature(role: string): boolean {
  return role === 'ADMIN' || role === 'PORTFOLIO_MANAGER'
}

/** GET /api/history (journal métier) — assuré exclu. */
export function canViewEntityHistory(role: string): boolean {
  return (
    role === 'ADMIN' ||
    role === 'PORTFOLIO_MANAGER' ||
    role === 'TRACKING_OFFICER' ||
    role === 'CUSTOMER_OFFICER'
  )
}

/** Liste courte d’assurés (GET /api/users/insured-options) — mêmes rôles que la création. */
export function canFetchInsuredOptions(role: string): boolean {
  return canCreateClaim(role)
}

/** POST /api/folders — ROLES_CREATE sur la route dossiers. */
export function canCreateFolderRecord(role: string): boolean {
  return role === 'ADMIN' || role === 'PORTFOLIO_MANAGER' || role === 'CUSTOMER_OFFICER'
}

/** `force` si sinistre incomplet — réservé admin / gestionnaire. */
export function canForceCreateFolder(role: string): boolean {
  return role === 'ADMIN' || role === 'PORTFOLIO_MANAGER'
}

/** PATCH /api/folders/:id/assign */
export function canAssignFolderOfficer(role: string): boolean {
  return role === 'ADMIN' || role === 'PORTFOLIO_MANAGER'
}

/** PATCH /api/folders/:id/close */
export function canCloseFolder(role: string): boolean {
  return role === 'ADMIN' || role === 'PORTFOLIO_MANAGER'
}

export type FolderStepFolderContext = {
  is_closed?: boolean
  assigned_officer_id?: number | null
}

/** POST /api/folders/:id/steps (hors flux RIB assuré). */
export function canPostFolderStep(
  role: string,
  folder: FolderStepFolderContext,
  userId: number
): boolean {
  if (folder.is_closed) return false
  if (role === 'ADMIN' || role === 'PORTFOLIO_MANAGER') return true
  if (role === 'TRACKING_OFFICER') {
    return Number(folder.assigned_officer_id) === Number(userId)
  }
  return false
}

/** PATCH /api/folders/:id/scenario (première définition) — mêmes acteurs que les étapes hors assuré. */
export function canSetFolderScenario(
  role: string,
  folder: FolderStepFolderContext,
  userId: number
): boolean {
  if (folder.is_closed) return false
  if (role === 'ADMIN' || role === 'PORTFOLIO_MANAGER') return true
  if (role === 'TRACKING_OFFICER') {
    return Number(folder.assigned_officer_id) === Number(userId)
  }
  return false
}

export function canAccessStaffSinistersAndFolders(role: string): boolean {
  return (
    role === 'ADMIN' ||
    role === 'PORTFOLIO_MANAGER' ||
    role === 'TRACKING_OFFICER' ||
    role === 'CUSTOMER_OFFICER'
  )
}

export function canAccessDocumentsAndHistory(role: string): boolean {
  return canAccessStaffSinistersAndFolders(role)
}

/** Notifications : tout utilisateur authentifié (route sans filtre de rôle). */
export function canAccessNotifications(_role: string): boolean {
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

export function allowedApiLinkKeys(role: string): Set<HomeApiLinkKey> {
  const keys = new Set<HomeApiLinkKey>()
  keys.add('docs')
  keys.add('auth')
  if (canListUsers(role)) keys.add('users')
  if (canAccessStaffSinistersAndFolders(role)) {
    keys.add('sinisters')
    keys.add('documents')
    keys.add('folders')
    keys.add('history')
  } else if (role === 'INSURED') {
    keys.add('sinisters')
    keys.add('documents')
    keys.add('folders')
  }
  if (canAccessNotifications(role)) keys.add('notifications')
  return keys
}

const linkMeta: Record<HomeApiLinkKey, { label: string }> = {
  docs: { label: 'Documentation (Swagger)' },
  auth: { label: 'Authentification' },
  users: { label: 'Utilisateurs (API)' },
  sinisters: { label: 'Sinistres' },
  documents: { label: 'Documents' },
  folders: { label: 'Dossiers' },
  history: { label: 'Historique' },
  notifications: { label: 'Notifications' }
}

export function getFilteredApiLinks(
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
