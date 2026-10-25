import type { RuteaRepository } from '@/planificacion-rutas/domain/repositories/RuteaRepository'
import type { EstadoServidor, ResumenGrafo, PaginaNodos, RedVial } from '@/planificacion-rutas/domain/models/grafo'
import { HttpClient } from '@/shared/infrastructure/http/httpClient'
import { leerEstado, leerResumen, leerNodos, leerRed } from './dtos'
import type { SolicitudRuta, ResultadoRuta } from '@/planificacion-rutas/domain/models/ruta'
import { leerRuta } from './rutaDTO'
import type { ComparacionRutas } from '@/planificacion-rutas/domain/models/ruta'
import type { Conectividad, RedMST, Sector } from '@/planificacion-rutas/domain/models/analisis'
import { leerComparacion, leerConectividad, leerMST, leerSectores } from './analisisDTO'

export class HttpRuteaRepository implements RuteaRepository {
  private zona = 'centro'
  seleccionarZona(zona: import('../../domain/models/zona').ZonaId) { this.zona = zona }
  private path(path: string) {
    return this.zona === 'centro' ? path : `${path}${path.includes('?') ? '&' : '?'}zona=${this.zona}`
  }
  constructor(private readonly http: HttpClient) {}

  async consultarEstado(signal?: AbortSignal): Promise<EstadoServidor> {
    const data = leerEstado(await this.http.get(this.path('/health'), signal))
    return { datasetDisponible: data.dataset_disponible }
  }

  async obtenerResumen(signal?: AbortSignal): Promise<ResumenGrafo> {
    const data = leerResumen(await this.http.get(this.path('/grafo/resumen'), signal))
    return { cantidadNodos: data.nodos, cantidadAristas: data.aristas,
      dirigido: data.dirigido, fuente: data.fuente, atribucion: data.atribucion }
  }

  async obtenerNodos(offset: number, limite: number, signal?: AbortSignal): Promise<PaginaNodos> {
    return leerNodos(await this.http.get(this.path(`/grafo/nodos?offset=${offset}&limite=${limite}`), signal))
  }

  async obtenerRed(signal?: AbortSignal): Promise<RedVial> {
    if (this.zona !== 'centro') {
      const red: RedVial = { type: 'FeatureCollection', features: [] }
      for (let offset = 0; ; offset += 2000) {
        signal?.throwIfAborted()
        const pagina = leerRed(await this.http.get(this.path(`/grafo/geojson?offset=${offset}&limite=2000`), signal))
        if (pagina.features.length > 2000) throw new Error('La API no admite la paginación del mapa. Reinicia el backend actualizado.')
        red.features.push(...pagina.features)
        if (pagina.features.length < 2000) return red
      }
    }
    return leerRed(await this.http.get(this.path('/grafo/geojson'), signal))
  }

  async calcularRuta(solicitud: SolicitudRuta, signal?: AbortSignal): Promise<ResultadoRuta> {
    const body = { origen: solicitud.origen, minuto_dia: solicitud.minutoDia, algoritmo: solicitud.algoritmo,
      ...(solicitud.tipo === 'punto_a_punto' ? { destino: solicitud.destino }
        : { destinos: solicitud.destinos, volver_origen: solicitud.volverOrigen }) }
    const path = solicitud.tipo === 'punto_a_punto' ? '/rutas/punto-a-punto' : '/rutas/multi-entrega'
    return leerRuta(await this.http.post(this.path(path), body, signal), solicitud)
  }

  async compararRutas(solicitud: SolicitudRuta, signal?: AbortSignal): Promise<ComparacionRutas> {
    const body = { origen: solicitud.origen, minuto_dia: solicitud.minutoDia,
      ...(solicitud.tipo === 'punto_a_punto' ? { destino: solicitud.destino }
        : { destinos: solicitud.destinos, volver_origen: solicitud.volverOrigen }) }
    const path = solicitud.tipo === 'punto_a_punto' ? '/rutas/comparar' : '/rutas/multi-entrega/comparar'
    return leerComparacion(await this.http.post(this.path(path), body, signal), solicitud)
  }

  async verificarConectividad(origen: string, destinos: string[], signal?: AbortSignal): Promise<Conectividad> {
    return leerConectividad(await this.http.post(this.path('/grafo/conectividad'), { origen, destinos }, signal), origen, destinos)
  }

  async obtenerMST(signal?: AbortSignal): Promise<RedMST> {
    return leerMST(await this.http.get(this.path('/grafo/mst'), signal))
  }

  async obtenerSectores(signal?: AbortSignal): Promise<Sector[]> {
    return leerSectores(await this.http.get(this.path('/grafo/sectores'), signal))
  }
}
