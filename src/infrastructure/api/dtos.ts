/** Validar el JSON: TypeScript no comprueba tipos durante la ejecución. */
import type { Nodo, PaginaNodos, RedVial } from '@/domain/models/grafo'
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

function numero(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function id(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function leerNodos(value: unknown): PaginaNodos {
  const data = objeto(value)
  if (!conteo(data.total) || !Array.isArray(data.nodos)) throw new Error('Página de nodos inválida.')
  const nodos: Nodo[] = data.nodos.map((value: unknown) => {
    const nodo = objeto(value)
    if (!id(nodo.id) || !numero(nodo.lat, -90, 90) || !numero(nodo.lon, -180, 180)) {
      throw new Error('Nodo con identificador o coordenadas inválidas.')
    }
    return { id: nodo.id, lat: nodo.lat, lon: nodo.lon }
  })
  return { total: data.total, nodos }
}

export function leerRed(value: unknown): RedVial {
  const data = objeto(value)
  if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Red vial GeoJSON inválida.')
  return { type: 'FeatureCollection', features: data.features.map((value: unknown) => {
    const feature = objeto(value)
    const geometry = objeto(feature.geometry)
    const props = objeto(feature.properties)
    if (feature.type !== 'Feature' || geometry.type !== 'LineString' ||
        !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2 ||
        !id(props.origen) || !id(props.destino) || typeof props.nombre !== 'string' ||
        !numero(props.longitud_m, Number.MIN_VALUE, Number.MAX_VALUE) || typeof props.sentido_unico !== 'boolean') {
      throw new Error('Calle GeoJSON inválida.')
    }
    const coordinates = geometry.coordinates.map((point: unknown): [number, number] => {
      if (!Array.isArray(point) || point.length !== 2 || !numero(point[0], -180, 180) || !numero(point[1], -90, 90)) {
        throw new Error('Coordenadas GeoJSON inválidas.')
      }
      return [point[0], point[1]]
    })
    return { type: 'Feature', geometry: { type: 'LineString', coordinates },
      properties: { origen: props.origen, destino: props.destino, nombre: props.nombre,
        longitud_m: props.longitud_m, sentido_unico: props.sentido_unico } }
  }) }
}
