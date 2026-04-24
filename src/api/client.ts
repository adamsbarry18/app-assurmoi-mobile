import { refreshRequest } from '@/api/auth.api'
import { getAccessToken, getRefreshToken, setTokens } from '@/auth/tokenStorage'
import { getApiBaseUrl } from '@/config/env'
import { ApiRequestError, type ApiErrorBody } from '@/api/errors'

export { getApiBaseUrl } from '@/config/env'

export type ApiWelcomePayload = {
  message: string
  docs: string
  auth: string
  users: string
  sinisters: string
  documents: string
  folders: string
  history: string
  notifications: string
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl()
  if (!path || path === '/') return `${base}/`
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function parseBody(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

function throwIfNotOk(res: Response, data: unknown): void {
  if (res.ok) return
  const body = data as ApiErrorBody | undefined
  const msg =
    (body && typeof body === 'object' && 'message' in body
      ? String((body as ApiErrorBody).message)
      : null) || `HTTP ${res.status}`
  throw new ApiRequestError(msg, res.status, body)
}

/**
 * Appel public (sans auth), ex. GET `/` ou ressource anonyme.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path)
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init?.body != null && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...init, headers })
  const data = parseBody(await res.text())
  throwIfNotOk(res, data)
  return data as T
}

/**
 * Appel vers `/api/...` avec **Authorization: Bearer** (jetons lus via AsyncStorage, comme le contexte d’auth).
 * Sur **401**, tente un **refresh** des jetons une fois, puis relance la requête.
 */
export async function apiFetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path)

  async function doRequest(access: string) {
    const headers = new Headers(init?.headers)
    if (!headers.has('Accept')) headers.set('Accept', 'application/json')
    headers.set('Authorization', `Bearer ${access}`)
    if (init?.body != null && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    const res = await fetch(url, { ...init, headers })
    const data = parseBody(await res.text())
    return { res, data }
  }

  let access = await getAccessToken()
  if (!access) {
    const refresh = await getRefreshToken()
    if (refresh) {
      try {
        const tokens = await refreshRequest(refresh)
        await setTokens(tokens.accessToken, tokens.refreshToken)
        access = tokens.accessToken
      } catch {
        throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
      }
    } else {
      throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
    }
  }

  let { res, data } = await doRequest(access!)

  if (res.status === 401) {
    const refresh = await getRefreshToken()
    if (!refresh) {
      throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
    }
    try {
      const tokens = await refreshRequest(refresh)
      await setTokens(tokens.accessToken, tokens.refreshToken)
      const retry = await doRequest(tokens.accessToken)
      res = retry.res
      data = retry.data
    } catch (e) {
      if (e instanceof ApiRequestError) throw e
      throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
    }
  }

  throwIfNotOk(res, data)
  return data as T
}

export type ApiBinaryResult = {
  arrayBuffer: ArrayBuffer
  /** Type MIME sans paramètres (ex. `image/jpeg`, `application/pdf`) */
  contentType: string
}

/**
 * GET binaire (ex. `GET /api/documents/:id` sans `meta=1`) avec la même logique Bearer + refresh
 * que `apiFetchWithAuth` — le corps n’est jamais interprété comme du JSON.
 */
export async function apiFetchBinaryWithAuth(
  path: string,
  init?: RequestInit
): Promise<ApiBinaryResult> {
  const url = buildUrl(path)

  async function doRequest(access: string) {
    const headers = new Headers(init?.headers)
    headers.set('Accept', '*/*')
    headers.set('Authorization', `Bearer ${access}`)
    const res = await fetch(url, { ...init, method: init?.method ?? 'GET', headers })
    return res
  }

  let access = await getAccessToken()
  if (!access) {
    const refresh = await getRefreshToken()
    if (refresh) {
      try {
        const tokens = await refreshRequest(refresh)
        await setTokens(tokens.accessToken, tokens.refreshToken)
        access = tokens.accessToken
      } catch {
        throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
      }
    } else {
      throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
    }
  }

  let res = await doRequest(access!)

  if (res.status === 401) {
    const refresh = await getRefreshToken()
    if (!refresh) {
      throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
    }
    try {
      const tokens = await refreshRequest(refresh)
      await setTokens(tokens.accessToken, tokens.refreshToken)
      res = await doRequest(tokens.accessToken)
    } catch (e) {
      if (e instanceof ApiRequestError) throw e
      throw new ApiRequestError('Session expirée : connectez-vous à nouveau.', 401)
    }
  }

  if (!res.ok) {
    const text = await res.text()
    const data = parseBody(text)
    throwIfNotOk(res, data)
    throw new ApiRequestError(`HTTP ${res.status}`, res.status)
  }

  const arrayBuffer = await res.arrayBuffer()
  const raw = res.headers.get('content-type')
  const contentType = raw ? raw.split(';')[0]!.trim() : 'application/octet-stream'
  return { arrayBuffer, contentType }
}

/** GET `/` — message d’accueil (public) */
export async function getApiRoot(): Promise<ApiWelcomePayload> {
  return apiFetch<ApiWelcomePayload>('/')
}
