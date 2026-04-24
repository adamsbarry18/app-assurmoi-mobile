import {
  canCreateSinister,
  canListUsers,
  canProvisionInsuredAccount,
  type UserRole
} from '@/utils/roleAccess'

export type QuickAction = {
  id: string
  label: string
  /** Nom d’icône MaterialCommunityIcons */
  icon: string
  /** Route interne (ex. /admin-users) */
  href?: `/${string}`
  /** Cible d’onglet (ex. claims) — pas d’onglet « plus » : doublon avec la barre du bas. */
  tab?: 'claims' | 'folders'
}

export function getHeroCopy(role: string): {
  title: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: `/${string}`
  ctaTab?: 'claims' | 'folders'
} {
  const r = role as UserRole
  switch (r) {
    case 'ADMIN':
      return {
        title: 'Pilotage de la plateforme',
        subtitle:
          'Création de comptes, supervision des sinistres et des dossiers de prise en charge.',
        ctaLabel: 'Ouvrir les sinistres',
        ctaTab: 'claims'
      }
    case 'PORTFOLIO_MANAGER':
      return {
        title: 'Supervision des sinistres',
        subtitle:
          'Vue globale des sinistres et dossiers, validation des documents et suivi des étapes.',
        ctaLabel: 'Ouvrir les sinistres',
        ctaTab: 'claims'
      }
    case 'TRACKING_OFFICER':
      return {
        title: 'Suivi de dossiers',
        subtitle:
          'Faites avancer les dossiers selon le processus et complétez chaque étape opérationnelle.',
        ctaLabel: 'Ouvrir les dossiers',
        ctaTab: 'folders'
      }
    case 'CUSTOMER_OFFICER':
      return {
        title: 'Déclaration et instruction',
        subtitle:
          'Enregistrez un sinistre, complétez les pièces et menez l’opération jusqu’à la génération du dossier.',
        ctaLabel: 'Ouvrir les sinistres',
        ctaTab: 'claims'
      }
    case 'INSURED':
    default:
      return {
        title: 'Votre espace assuré',
        subtitle:
          'Consultez l’avancement de vos sinistres et dossiers. Déposez votre RIB lorsque le dossier est en perte totale (scénario indemnisation).',
        ctaLabel: 'Mes sinistres',
        ctaTab: 'claims'
      }
  }
}

/**
 * Raccourcis (accueil, menu ⋮) : écrans hors onglets du bas.
 * Sinistres / Dossiers : déjà dans la barre d’onglets — pas de doublon ici.
 */
export function getQuickActions(role: string): QuickAction[] {
  const r = role as UserRole
  const createClaim: QuickAction | null = canCreateSinister(r)
    ? {
        id: 'new-claim',
        label: 'Nouveau sinistre',
        icon: 'plus-circle-outline',
        href: '/claim/create'
      }
    : null
  const teamUsersAction: QuickAction | null = canListUsers(r)
    ? { id: 'team-users', label: 'Équipe', icon: 'account-tie', href: '/admin-users' }
    : null
  const insuredUsersAction: QuickAction | null = canListUsers(r)
    ? { id: 'insured-users', label: 'Assurés', icon: 'account-heart', href: '/insured-users' }
    : null
  /** Fiche assuré (page dédiée) — e-mail 1er accès depuis la liste quand voulu. */
  const newInsuredAction: QuickAction | null = canProvisionInsuredAccount(r)
    ? {
        id: 'new-insured',
        label: 'Nouvel assuré',
        icon: 'account-plus-outline',
        href: '/provision-insured'
      }
    : null

  switch (r) {
    case 'ADMIN':
      return [
        ...(teamUsersAction ? [teamUsersAction] : []),
        ...(insuredUsersAction ? [insuredUsersAction] : []),
        ...(newInsuredAction ? [newInsuredAction] : []),
        ...(createClaim ? [createClaim] : [])
      ]
    case 'PORTFOLIO_MANAGER':
    case 'CUSTOMER_OFFICER':
      return [
        ...(teamUsersAction ? [teamUsersAction] : []),
        ...(insuredUsersAction ? [insuredUsersAction] : []),
        ...(newInsuredAction ? [newInsuredAction] : []),
        ...(createClaim ? [createClaim] : [])
      ]
    case 'TRACKING_OFFICER':
      return []
    case 'INSURED':
      return [...(createClaim ? [createClaim] : [])]
    default:
      return []
  }
}
