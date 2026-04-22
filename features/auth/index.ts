/**
 * Couche d’authentification : contexte (session) + hooks.
 * Les écrans de connexion / mot de passe oublié sont dans `app/`.
 * Appels HTTP et stockage de jetons : `@/lib/auth`.
 */
export { AuthProvider, useAuth } from './context/AuthContext'
