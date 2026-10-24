/** Validar el JSON: TypeScript no comprueba tipos durante la ejecución. */
export interface EstadoDTO { status: 'ok'; dataset_disponible: boolean }
export interface ResumenDTO {
  nodos: number
  aristas: number
  dirigido: boolean
  fuente: string
  atribucion: string
}

function objeto(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('La respuesta de la API tiene un formato inesperado.')
  }
  return value as Record<string, unknown>
}

function conteo(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function leerEstado(value: unknown): EstadoDTO {
  const data = objeto(value)
  if (data.status !== 'ok' || typeof data.dataset_disponible !== 'boolean') {
    throw new Error('La respuesta de estado no cumple el contrato de la API.')
  }
  return { status: data.status, dataset_disponible: data.dataset_disponible }
}

export function leerResumen(value: unknown): ResumenDTO {
  const data = objeto(value)
  if (!conteo(data.nodos) || !conteo(data.aristas) || typeof data.dirigido !== 'boolean' ||
      typeof data.fuente !== 'string' || !data.fuente.trim() || typeof data.atribucion !== 'string' || !data.atribucion.trim()) {
    throw new Error('El resumen del grafo no cumple el contrato de la API.')
  }
  return { nodos: data.nodos, aristas: data.aristas, dirigido: data.dirigido,
    fuente: data.fuente, atribucion: data.atribucion }
}
