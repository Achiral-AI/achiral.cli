export class AchiralClient {
  private readonly baseUrl: string
  private readonly token: string

  /**
   * @param workspace  Org slug, e.g. "mycompany"
   * @param token      API token from the Achiral dashboard
   * @param dev        Use http:// instead of https:// (local dev only)
   */
  constructor(workspace: string, token: string, dev?: boolean) {
    const protocol = dev ? 'http' : 'https'
    this.baseUrl = `${protocol}://${workspace}.achiral.ai`
    this.token = token
  }

  // ── Core fetch ─────────────────────────────────────────────────────────────

  async fetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
        'X-Client': 'achiral-cli/0.1.0',
        ...init.headers,
      },
    })

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`
      try {
        const body = await res.json() as { error?: string; message?: string }
        errorMessage = body.error ?? body.message ?? errorMessage
      } catch {
        // non-JSON error body
      }
      throw new AchiralApiError(errorMessage, res.status)
    }

    return res.json() as Promise<T>
  }

  async get<T>(path: string): Promise<T> {
    return this.fetch<T>(path, { method: 'GET' })
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }
}

export class AchiralApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'AchiralApiError'
  }
}
