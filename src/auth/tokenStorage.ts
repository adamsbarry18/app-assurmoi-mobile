import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY_ACCESS = 'assurmoi.accessToken'
const KEY_REFRESH = 'assurmoi.refreshToken'

async function getItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key)
  } catch {
    return null
  }
}

async function setItem(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value)
}

async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key)
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
  try {
    await AsyncStorage.multiRemove([KEY_ACCESS, KEY_REFRESH])
  } catch {
    await removeItem(KEY_ACCESS)
    await removeItem(KEY_REFRESH)
  }
}
