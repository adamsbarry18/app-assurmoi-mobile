import type { Href } from 'expo-router'

/**
 * Chemins Expo Router réutilisés dans l’app.
 * Les cast `as Href` sont regroupés ici : les types générés (`.expo/types/router.d.ts`)
 * peuvent prendre un cycle pour inclure les nouvelles routes après un `expo start`.
 */
export const ROUTES = {
  usersStaff: '/users/staff' as Href,
  usersInsured: '/users/insured' as Href,
  provisionInsured: '/provision-insured' as Href
} as const
