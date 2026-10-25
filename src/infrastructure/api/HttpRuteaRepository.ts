import type { RuteaRepository } from '@/domain/repositories/RuteaRepository'
import type { EstadoServidor, ResumenGrafo, PaginaNodos, RedVial } from '@/domain/models/grafo'
import { HttpClient } from '@/infrastructure/http/httpClient'
import { leerEstado, leerResumen, leerNodos, leerRed } from './dtos'

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
}
