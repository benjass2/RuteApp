import type { RuteaRepository } from '@/planificacion-rutas/domain/repositories/RuteaRepository'
import type { SolicitudRuta } from '@/planificacion-rutas/domain/models/ruta'

export function validarSolicitudRuta(solicitud: SolicitudRuta): void {
  const destinos = solicitud.tipo === 'punto_a_punto' ? [solicitud.destino] : solicitud.destinos
  if (!solicitud.origen || !destinos.length || destinos.some(d => !d || d === solicitud.origen) ||
      new Set(destinos).size !== destinos.length) throw new Error('Selecciona un punto de recojo y entregas distintas, sin repetir.')
  if (!Number.isInteger(solicitud.minutoDia) || solicitud.minutoDia < 0 || solicitud.minutoDia > 1439) {
    throw new Error('Selecciona una hora de salida válida.')
  }
  if (solicitud.tipo === 'multi_entrega' && destinos.length > (solicitud.algoritmo === 'backtracking' ? 8 : 12)) {
    throw new Error(solicitud.algoritmo === 'backtracking' ? 'Backtracking admite hasta 8 entregas. Usa Held-Karp para más paradas.' : 'Selecciona hasta 12 entregas.')
  }
}

export async function calcularRuta(repository: RuteaRepository, solicitud: SolicitudRuta, signal?: AbortSignal) {
  validarSolicitudRuta(solicitud)
  return repository.calcularRuta(solicitud, signal)
}
