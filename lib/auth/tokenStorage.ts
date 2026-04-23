import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const KEY_ACCESS = 'assurmoi.accessToken'
const KEY_REFRESH = 'assurmoi.refreshToken'

const isWeb = Platform.OS === 'web'

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
        return null
      }
      return globalThis.localStorage.getItem(key)
    } catch {
      return null
    }
  }
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.setItem(key, value)
    }
    return
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED
  })
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        globalThis.localStorage.removeItem(key)
      }
    } catch {
      /* ignore */
    }
    return
  }
  try {
    await SecureStore.deleteItemAsync(key)
  } catch {
    /* ignore */
  }
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(KEY_ACCESS)
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(KEY_REFRESH)
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await setItem(KEY_ACCESS, accessToken)
  await setItem(KEY_REFRESH, refreshToken)
}

export async function clearTokens(): Promise<void> {
  await removeItem(KEY_ACCESS)
  await removeItem(KEY_REFRESH)
}
