export type ApiErrorBody = {
  message?: string
  code?: string
}

export class ApiRequestError extends Error {
  constructor (
    message: string,
    public readonly status: number,
    public readonly body?: ApiErrorBody
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}
