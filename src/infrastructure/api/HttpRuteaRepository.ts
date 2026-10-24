import type { RuteaRepository } from '@/domain/repositories/RuteaRepository'
import type { EstadoServidor, ResumenGrafo } from '@/domain/models/grafo'
import { HttpClient } from '@/infrastructure/http/httpClient'
import { leerEstado, leerResumen } from './dtos'

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
}
