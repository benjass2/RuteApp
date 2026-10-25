import type { Conectividad, RedMST, Sector, SectorId } from '@/planificacion-rutas/domain/models/analisis'
import type { ComparacionRutas, SolicitudRuta } from '@/planificacion-rutas/domain/models/ruta'
import { objeto, numero, id, leerRed } from './dtos'
import { leerRuta } from './rutaDTO'

function contador(value: unknown): number {
  if (!numero(value, 0, Number.MAX_SAFE_INTEGER) || !Number.isInteger(value)) throw new Error('Contador de análisis inválido.')
  return value
}

export function leerComparacion(value: unknown, solicitud: SolicitudRuta): ComparacionRutas {
  const data = objeto(value)
  if (!Array.isArray(data.resultados) || data.resultados.length !== 2 || typeof data.costos_equivalentes !== 'boolean') {
    throw new Error('Comparación de algoritmos inválida.')
  }
  const primero = leerRuta(data.resultados[0], solicitud.tipo === 'punto_a_punto'
    ? { ...solicitud, algoritmo: 'dijkstra' } : { ...solicitud, algoritmo: 'held_karp' })
  const segundo = leerRuta(data.resultados[1], solicitud.tipo === 'punto_a_punto'
    ? { ...solicitud, algoritmo: 'bellman_ford' } : { ...solicitud, algoritmo: 'backtracking' })
  const diferencia = Math.abs(primero.costoPonderadoM - segundo.costoPonderadoM)
  const equivalentes = diferencia <= Math.max(1e-6, 1e-9 * Math.max(primero.costoPonderadoM, segundo.costoPonderadoM))
  if (equivalentes !== data.costos_equivalentes) throw new Error('La equivalencia de costos es inconsistente.')
  return { resultados: [primero, segundo], costosEquivalentes: equivalentes }
}

export function leerConectividad(value: unknown, origen: string, destinos: string[]): Conectividad {
  const data = objeto(value)
  if (data.origen !== origen || data.tipo !== 'debil' || data.garantiza_ruta_dirigida !== false ||
      !Array.isArray(data.destinos) || data.destinos.length !== destinos.length) throw new Error('Respuesta UFDS inválida.')
  return { origen, destinos: data.destinos.map((value: unknown, index: number) => {
    const item = objeto(value)
    if (item.id !== destinos[index] || typeof item.misma_componente !== 'boolean') throw new Error('Destino UFDS inválido.')
    return { id: destinos[index]!, mismaComponente: item.misma_componente }
  }) }
}

export function leerMST(value: unknown): RedMST {
  const data = objeto(value)
  if (data.algoritmo !== 'kruskal' || data.proyeccion !== 'no_dirigida' || data.criterio_peso !== 'longitud_m' ||
      !numero(data.distancia_km, 0, Number.MAX_VALUE) || !numero(data.tiempo_ms, 0, Number.MAX_VALUE)) throw new Error('Red MST inválida.')
  const nodos = contador(data.nodos), aristas = contador(data.aristas_seleccionadas), componentes = contador(data.componentes)
  const red = leerRed(data.geojson)
  if (aristas !== nodos - componentes || red.features.length !== aristas ||
      data.es_arbol !== (componentes === 1) || data.es_conexo !== (componentes === 1)) throw new Error('Métricas MST inconsistentes.')
  return { red, nodos, aristas, componentes, distanciaKm: data.distancia_km, tiempoMs: data.tiempo_ms, esArbol: componentes === 1 }
}

export function leerSectores(value: unknown): Sector[] {
  const data = objeto(value)
  const sectores: SectorId[] = ['SO', 'SE', 'NO', 'NE']
  if (!Array.isArray(data.sectores) || data.sectores.length !== 4) throw new Error('Se requieren cuatro sectores.')
  const vistos = new Set<string>()
  const ids = new Set<string>()
  return data.sectores.map((value: unknown) => {
    const item = objeto(value)
    if (!sectores.includes(item.id as SectorId) || vistos.has(String(item.id)) ||
        !Array.isArray(item.nodos) || item.total !== item.nodos.length || !item.nodos.every(id)) throw new Error('Sector geográfico inválido.')
    vistos.add(String(item.id))
    for (const nodo of item.nodos as string[]) {
      if (ids.has(nodo)) throw new Error('Nodo repetido entre sectores.')
      ids.add(nodo)
    }
    return { id: item.id as SectorId, nodos: item.nodos as string[] }
  })
}
