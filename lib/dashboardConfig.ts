import { canCreateClaim, type UserRole } from '@/lib/roleAccess'

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
        ctaLabel: 'Gérer les utilisateurs',
        ctaHref: '/admin-users'
      }
    case 'PORTFOLIO_MANAGER':
      return {
        title: 'Supervision des sinistres',
        subtitle:
          'Vue globale des sinistres et dossiers, validation des documents et suivi des étapes.',
        ctaLabel: 'Voir les sinistres',
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
        ctaLabel: 'Espace sinistres',
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
 * Raccourcis (accueil, menu ⋮) : écrans métier uniquement.
 * Pas de lien vers l’onglet « Plus » (profil / réglages) : évite le doublon « Menu dans Menu ».
 */
export function getQuickActions(role: string): QuickAction[] {
  const r = role as UserRole
  const base: QuickAction[] = [
    { id: 'claims', label: 'Sinistres', icon: 'file-document-outline', tab: 'claims' },
    { id: 'folders', label: 'Dossiers', icon: 'folder-outline', tab: 'folders' }
  ]
  const createClaim: QuickAction | null = canCreateClaim(r)
    ? {
        id: 'new-claim',
        label: 'Nouveau sinistre',
        icon: 'plus-circle-outline',
        href: '/claim/create'
      }
    : null
  switch (r) {
    case 'ADMIN':
      return [
        { id: 'users', label: 'Utilisateurs', icon: 'account-supervisor', href: '/admin-users' },
        ...(createClaim ? [createClaim] : []),
        ...base
      ]
    case 'PORTFOLIO_MANAGER':
    case 'CUSTOMER_OFFICER':
      return [...(createClaim ? [createClaim] : []), ...base]
    case 'TRACKING_OFFICER':
      return [
        {
          id: 'folders-tracking',
          label: 'Mes dossiers',
          icon: 'folder-cog-outline',
          tab: 'folders'
        }
      ]
    case 'INSURED':
      return [
        { id: 'my-claims', label: 'Mes sinistres', icon: 'car-outline', tab: 'claims' },
        { id: 'my-folders', label: 'Mes dossiers', icon: 'file-tree-outline', tab: 'folders' }
      ]
    default:
      return base
  }
}
