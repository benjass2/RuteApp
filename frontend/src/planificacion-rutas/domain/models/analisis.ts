import type { RedVial } from './grafo'

export interface Conectividad {
  origen: string
  destinos: { id: string; mismaComponente: boolean }[]
}

export interface RedMST {
  red: RedVial
  nodos: number
  aristas: number
  componentes: number
  distanciaKm: number
  tiempoMs: number
  esArbol: boolean
}

export type SectorId = 'SO' | 'SE' | 'NO' | 'NE'
export interface Sector { id: SectorId; nodos: string[] }
