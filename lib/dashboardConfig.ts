import { type UserRole } from '@/lib/roleAccess'

export type QuickAction = {
  id: string
  label: string
  /** Nom d’icône MaterialCommunityIcons */
  icon: string
  /** Route interne (ex. /admin-users) */
  href?: `/${string}`
  /** Cible d’onglet (ex. sinistres) — pas d’onglet « plus » : doublon avec la barre du bas. */
  tab?: 'sinistres' | 'dossiers'
}

export function getHeroCopy (role: string): { title: string; subtitle: string; ctaLabel?: string; ctaHref?: `/${string}`; ctaTab?: 'sinistres' | 'dossiers' } {
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
        ctaTab: 'sinistres'
      }
    case 'TRACKING_OFFICER':
      return {
        title: 'Suivi de dossiers',
        subtitle:
          'Faites avancer les dossiers selon le processus et complétez chaque étape opérationnelle.',
        ctaLabel: 'Ouvrir les dossiers',
        ctaTab: 'dossiers'
      }
    case 'CUSTOMER_OFFICER':
      return {
        title: 'Déclaration et instruction',
        subtitle:
          'Enregistrez un sinistre, complétez les pièces et menez l’opération jusqu’à la génération du dossier.',
        ctaLabel: 'Espace sinistres',
        ctaTab: 'sinistres'
      }
    case 'INSURED':
    default:
      return {
        title: 'Votre espace assuré',
        subtitle:
          'Bientôt : suivi en temps réel de vos sinistres et de vos dossiers, dépôt de documents et messages.',
        ctaLabel: 'Voir mes sinistres',
        ctaTab: 'sinistres'
      }
  }
}

/**
 * Raccourcis (accueil, menu ⋮) : écrans métier uniquement.
 * Pas de lien vers l’onglet « Plus » (profil / réglages) : évite le doublon « Menu dans Menu ».
 */
export function getQuickActions (role: string): QuickAction[] {
  const r = role as UserRole
  const base: QuickAction[] = [
    { id: 'sinistres', label: 'Sinistres', icon: 'file-document-outline', tab: 'sinistres' },
    { id: 'dossiers', label: 'Dossiers', icon: 'folder-outline', tab: 'dossiers' }
  ]
  if (r === 'ADMIN') {
    return [
      { id: 'users', label: 'Utilisateurs', icon: 'account-supervisor', href: '/admin-users' },
      ...base
    ]
  }
  if (r === 'PORTFOLIO_MANAGER' || r === 'CUSTOMER_OFFICER') {
    return [...base]
  }
  if (r === 'TRACKING_OFFICER') {
    return [{ id: 'dossiers2', label: 'Mes dossiers', icon: 'folder-cog-outline', tab: 'dossiers' }]
  }
  if (r === 'INSURED') {
    return [
      { id: 'mes-sinistres', label: 'Mes sinistres', icon: 'car-outline', tab: 'sinistres' },
      { id: 'mes-dossiers', label: 'Mes dossiers', icon: 'file-tree-outline', tab: 'dossiers' }
    ]
  }
  return base
}
