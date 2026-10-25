import type { EstadoServidor, ResumenGrafo, PaginaNodos, RedVial } from '@/planificacion-rutas/domain/models/grafo'
import type { SolicitudRuta, ResultadoRuta, ComparacionRutas } from '@/planificacion-rutas/domain/models/ruta'
import type { Conectividad, RedMST, Sector } from '@/planificacion-rutas/domain/models/analisis'

/** Puerto independiente de Fetch y del formato HTTP. */
export interface RuteaRepository {
  seleccionarZona(zona: import('../models/zona').ZonaId): void
  consultarEstado(signal?: AbortSignal): Promise<EstadoServidor>
  obtenerResumen(signal?: AbortSignal): Promise<ResumenGrafo>
  obtenerNodos(offset: number, limite: number, signal?: AbortSignal): Promise<PaginaNodos>
  obtenerRed(signal?: AbortSignal): Promise<RedVial>
  calcularRuta(solicitud: SolicitudRuta, signal?: AbortSignal): Promise<ResultadoRuta>
  compararRutas(solicitud: SolicitudRuta, signal?: AbortSignal): Promise<ComparacionRutas>
  verificarConectividad(origen: string, destinos: string[], signal?: AbortSignal): Promise<Conectividad>
  obtenerMST(signal?: AbortSignal): Promise<RedMST>
  obtenerSectores(signal?: AbortSignal): Promise<Sector[]>
}
