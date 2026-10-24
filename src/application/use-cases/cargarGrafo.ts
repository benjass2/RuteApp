import type { EstadoGrafo } from '@/domain/models/grafo'
import type { RuteaRepository } from '@/domain/repositories/RuteaRepository'

export async function cargarEstadoGrafo(repository: RuteaRepository, signal?: AbortSignal): Promise<EstadoGrafo> {
  const estado = await repository.consultarEstado(signal)
  if (!estado.datasetDisponible) return { tipo: 'sin_dataset' }
  return { tipo: 'listo', resumen: await repository.obtenerResumen(signal) }
}
