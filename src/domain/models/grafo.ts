import type { FeatureCollection, LineString } from 'geojson'

export interface Nodo {
  id: string
  lat: number
  lon: number
}

export interface PaginaNodos {
  total: number
  nodos: Nodo[]
}

export interface Calle {
  origen: string
  destino: string
  nombre: string
  longitud_m: number
  sentido_unico: boolean
}

export type RedVial = FeatureCollection<LineString, Calle>

export interface DatosMapa {
  nodos: Nodo[]
  red: RedVial
}

export interface EstadoServidor {
  datasetDisponible: boolean
}

export interface ResumenGrafo {
  cantidadNodos: number
  cantidadAristas: number
  dirigido: boolean
  fuente: string
  atribucion: string
}

export type EstadoGrafo =
  | { tipo: 'listo'; resumen: ResumenGrafo }
  | { tipo: 'sin_dataset' }
