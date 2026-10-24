import type { EstadoServidor, ResumenGrafo } from '@/domain/models/grafo'

/** Puerto independiente de Fetch y del formato HTTP. */
export interface RuteaRepository {
  consultarEstado(signal?: AbortSignal): Promise<EstadoServidor>
  obtenerResumen(signal?: AbortSignal): Promise<ResumenGrafo>
}
