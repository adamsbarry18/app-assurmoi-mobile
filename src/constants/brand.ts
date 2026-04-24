/**
 * Couleurs de marque et dégradés (alignés sur l’esprit des applis d’assurance : bleu, sobriété).
 */
export const BrandColors = {
  primary: '#0D47A1',
  primaryMid: '#1565C0',
  primaryLight: '#1976D2',
  /** Onglets inactifs (barre du bas) : assez foncé pour ne pas ressembler à du « désactivé » */
  tabBarInactive: '#5A6B7A',
  /** Dégradé bandeau connexion (LinearGradient) */
  gradient: ['#0D47A1', '#1565C0', '#1976D2'] as const,
  /** Prénom / nom sur le message « Bienvenue … » (contraste sur fond bleu) */
  welcomeName: '#4ADE80'
} as const
