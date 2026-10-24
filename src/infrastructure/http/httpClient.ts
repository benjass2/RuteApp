export class HttpError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message)
    this.name = 'HttpError'
  }
}

function mensajeRespuesta(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || !('detail' in data)) return
  const detail = data.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.flatMap((item: unknown) => {
      if (!item || typeof item !== 'object' || !('msg' in item) || typeof item.msg !== 'string') return []
      return [item.msg]
    }).join('; ') || undefined
  }
}

export class HttpClient {
  constructor(private readonly baseUrl = '/api', private readonly timeoutMs = 15_000) {}

  async get(path: string, signal?: AbortSignal): Promise<unknown> {
    const controller = new AbortController()
    const cancelar = () => controller.abort()
    let timeout = false
    if (signal?.aborted) controller.abort()
    signal?.addEventListener('abort', cancelar, { once: true })
    const timer = setTimeout(() => { timeout = true; controller.abort() }, this.timeoutMs)
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        signal: controller.signal, headers: { Accept: 'application/json' },
      })
      const text = await response.text()
      let data: unknown
      try { data = JSON.parse(text) as unknown } catch {
        if (response.ok) throw new HttpError('La API devolvió una respuesta que no es JSON.', response.status)
      }
      if (!response.ok) {
        throw new HttpError(mensajeRespuesta(data) ?? `No se pudo consultar la API (HTTP ${response.status}).`, response.status)
      }
      return data
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Solicitud cancelada', 'AbortError')
      if (timeout) throw new HttpError('La API tardó demasiado en responder. Intenta nuevamente.')
      if (error instanceof HttpError) throw error
      throw new HttpError('No se pudo conectar con la API. Comprueba que FastAPI esté iniciado.')
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancelar)
    }
  }
}
