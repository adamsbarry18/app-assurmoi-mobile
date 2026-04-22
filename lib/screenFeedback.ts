export type ScreenFeedback = { message: string; isError?: boolean }

let pending: ScreenFeedback | null = null

/** Appeler avant `router.replace` / `push` vers un autre écran. */
export function setScreenFeedback (f: ScreenFeedback): void {
  pending = f
}

/** Un seul consommateur (ex. écran cible) au prochain focus. */
export function consumeScreenFeedback (): ScreenFeedback | null {
  const p = pending
  pending = null
  return p
}
