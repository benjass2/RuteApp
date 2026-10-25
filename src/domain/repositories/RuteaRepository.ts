import type { EstadoServidor, ResumenGrafo, PaginaNodos, RedVial } from '@/domain/models/grafo'

/** Puerto independiente de Fetch y del formato HTTP. */
export interface RuteaRepository {
  consultarEstado(signal?: AbortSignal): Promise<EstadoServidor>
  obtenerResumen(signal?: AbortSignal): Promise<ResumenGrafo>
  obtenerNodos(offset: number, limite: number, signal?: AbortSignal): Promise<PaginaNodos>
  obtenerRed(signal?: AbortSignal): Promise<RedVial>
}
