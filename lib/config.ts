import { Platform } from 'react-native'

/**
 * URL de base de l’API AssurMoi (sans slash final).
 * `EXPO_PUBLIC_API_URL` dans `.env` — voir `APP-ASSURMOI-MOBILE/.env.example`.
 * Pour **Expo Web** + API en Docker sur la même machine : `http://localhost:3000`
 * (éviter une IP LAN dans le navigateur si l’API est sur le même poste).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv

  if (!__DEV__) {
    return 'http://localhost:3000'
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000'
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:3000'
  }

  return 'http://localhost:3000'
}
