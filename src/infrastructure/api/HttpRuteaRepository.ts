import type { RuteaRepository } from '@/domain/repositories/RuteaRepository'
import type { EstadoServidor, ResumenGrafo, PaginaNodos, RedVial } from '@/domain/models/grafo'
import { HttpClient } from '@/infrastructure/http/httpClient'
import { leerEstado, leerResumen, leerNodos, leerRed } from './dtos'
import type { SolicitudRuta, ResultadoRuta } from '@/domain/models/ruta'
import { leerRuta } from './rutaDTO'
import type { ComparacionRutas } from '@/domain/models/ruta'
import type { Conectividad, RedMST, Sector } from '@/domain/models/analisis'
import { leerComparacion, leerConectividad, leerMST, leerSectores } from './analisisDTO'

export class HttpRuteaRepository implements RuteaRepository {
  constructor(private readonly http: HttpClient) {}

  async consultarEstado(signal?: AbortSignal): Promise<EstadoServidor> {
    const data = leerEstado(await this.http.get('/health', signal))
    return { datasetDisponible: data.dataset_disponible }
  }

  async obtenerResumen(signal?: AbortSignal): Promise<ResumenGrafo> {
    const data = leerResumen(await this.http.get('/grafo/resumen', signal))
    return { cantidadNodos: data.nodos, cantidadAristas: data.aristas,
      dirigido: data.dirigido, fuente: data.fuente, atribucion: data.atribucion }
  }

  async obtenerNodos(offset: number, limite: number, signal?: AbortSignal): Promise<PaginaNodos> {
    return leerNodos(await this.http.get(`/grafo/nodos?offset=${offset}&limite=${limite}`, signal))
  }

  async obtenerRed(signal?: AbortSignal): Promise<RedVial> {
    return leerRed(await this.http.get('/grafo/geojson', signal))
  }

  async calcularRuta(solicitud: SolicitudRuta, signal?: AbortSignal): Promise<ResultadoRuta> {
    const body = { origen: solicitud.origen, minuto_dia: solicitud.minutoDia, algoritmo: solicitud.algoritmo,
      ...(solicitud.tipo === 'punto_a_punto' ? { destino: solicitud.destino }
        : { destinos: solicitud.destinos, volver_origen: solicitud.volverOrigen }) }
    const path = solicitud.tipo === 'punto_a_punto' ? '/rutas/punto-a-punto' : '/rutas/multi-entrega'
    return leerRuta(await this.http.post(path, body, signal), solicitud)
  }

  async compararRutas(solicitud: SolicitudRuta, signal?: AbortSignal): Promise<ComparacionRutas> {
    const body = { origen: solicitud.origen, minuto_dia: solicitud.minutoDia,
      ...(solicitud.tipo === 'punto_a_punto' ? { destino: solicitud.destino }
        : { destinos: solicitud.destinos, volver_origen: solicitud.volverOrigen }) }
    const path = solicitud.tipo === 'punto_a_punto' ? '/rutas/comparar' : '/rutas/multi-entrega/comparar'
    return leerComparacion(await this.http.post(path, body, signal), solicitud)
  }

  async verificarConectividad(origen: string, destinos: string[], signal?: AbortSignal): Promise<Conectividad> {
    return leerConectividad(await this.http.post('/grafo/conectividad', { origen, destinos }, signal), origen, destinos)
  }

  async obtenerMST(signal?: AbortSignal): Promise<RedMST> {
    return leerMST(await this.http.get('/grafo/mst', signal))
  }

  async obtenerSectores(signal?: AbortSignal): Promise<Sector[]> {
    return leerSectores(await this.http.get('/grafo/sectores', signal))
  }
}
