import type { LineString, Point } from 'geojson'
import type { ResultadoRuta, SolicitudRuta } from '@/planificacion-rutas/domain/models/ruta'
import { id, numero, objeto } from './dtos'

function positivo(value: unknown): number {
  if (!numero(value, 0, Number.MAX_VALUE)) throw new Error('La ruta contiene métricas inválidas.')
  return value
}

function entero(value: unknown): number {
  const number = positivo(value)
  if (!Number.isSafeInteger(number)) throw new Error('La ruta contiene un contador inválido.')
  return number
}

function ids(value: unknown): string[] {
  if (!Array.isArray(value) || !value.length || !value.every(id)) throw new Error('La ruta contiene nodos inválidos.')
  return value as string[]
}

function coordenada(value: unknown): [number, number] {
  if (!Array.isArray(value) || value.length !== 2 || !numero(value[0], -180, 180) || !numero(value[1], -90, 90)) {
    throw new Error('La ruta contiene coordenadas inválidas.')
  }
  return [value[0], value[1]]
}

function geometria(value: unknown): LineString | Point {
  const data = objeto(value)
  if (data.type === 'Point') return { type: 'Point', coordinates: coordenada(data.coordinates) }
  if (data.type === 'LineString' && Array.isArray(data.coordinates) && data.coordinates.length >= 2) {
    return { type: 'LineString', coordinates: data.coordinates.map(coordenada) }
  }
  throw new Error('La ruta no contiene una geometría válida.')
}

export function leerRuta(value: unknown, solicitud: SolicitudRuta): ResultadoRuta {
  const data = objeto(value)
  if (data.algoritmo !== solicitud.algoritmo || data.minuto_dia !== solicitud.minutoDia || data.trafico !== 'simulado') {
    throw new Error('La respuesta no coincide con la ruta solicitada.')
  }
  const nodos = ids(data.nodos)
  const orden = solicitud.tipo === 'multi_entrega' ? ids(data.orden_visita) : [solicitud.origen, solicitud.destino]
  if (nodos[0] !== solicitud.origen || orden[0] !== solicitud.origen || nodos.at(-1) !== orden.at(-1)) {
    throw new Error('Los extremos del recorrido no coinciden con la solicitud.')
  }
  if (solicitud.tipo === 'punto_a_punto') {
    if (data.origen !== solicitud.origen || data.destino !== solicitud.destino) throw new Error('Ruta con extremos incorrectos.')
  } else {
    const paradas = solicitud.volverOrigen ? orden.slice(1, -1) : orden.slice(1)
    if (data.volver_origen !== solicitud.volverOrigen ||
        (solicitud.volverOrigen && orden.at(-1) !== solicitud.origen) ||
        paradas.length !== solicitud.destinos.length || new Set(paradas).size !== paradas.length ||
        paradas.some(p => !solicitud.destinos.includes(p))) {
      throw new Error('La secuencia de visitas no coincide con las entregas solicitadas.')
    }
  }
  return { tipo: solicitud.tipo, algoritmo: solicitud.algoritmo, nodos, ordenVisita: orden,
    distanciaKm: positivo(data.distancia_km), costoPonderadoM: positivo(data.costo_ponderado_m),
    tiempoMs: positivo(data.tiempo_ms), tiempoAlgoritmoMs: positivo(data.tiempo_algoritmo_ms),
    tiempoMatrizMs: solicitud.tipo === 'multi_entrega' ? positivo(data.tiempo_matriz_ms) : null,
    evaluados: entero(solicitud.tipo === 'multi_entrega' ? data.estados_evaluados : data.nodos_evaluados),
    unidadEvaluados: solicitud.tipo === 'multi_entrega' ? 'estados' : 'nodos', geometria: geometria(data.geometria) }
}
