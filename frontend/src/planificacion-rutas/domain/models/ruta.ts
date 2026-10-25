import type { LineString, Point } from 'geojson'

export type AlgoritmoPunto = 'dijkstra' | 'bellman_ford'
export type AlgoritmoMulti = 'held_karp' | 'backtracking'

export type SolicitudRuta =
  | { tipo: 'punto_a_punto'; origen: string; destino: string; minutoDia: number; algoritmo: AlgoritmoPunto }
  | { tipo: 'multi_entrega'; origen: string; destinos: string[]; minutoDia: number; algoritmo: AlgoritmoMulti; volverOrigen: boolean }

export interface ResultadoRuta {
  tipo: SolicitudRuta['tipo']
  algoritmo: AlgoritmoPunto | AlgoritmoMulti
  ordenVisita: string[]
  nodos: string[]
  distanciaKm: number
  costoPonderadoM: number
  tiempoMs: number
  tiempoAlgoritmoMs: number
  tiempoMatrizMs: number | null
  evaluados: number
  unidadEvaluados: 'nodos' | 'estados'
  geometria: LineString | Point
}

export interface ComparacionRutas {
  resultados: [ResultadoRuta, ResultadoRuta]
  costosEquivalentes: boolean
}
