import type { DatosMapa, Nodo, ResumenGrafo } from '@/planificacion-rutas/domain/models/grafo'
import type { RuteaRepository } from '@/planificacion-rutas/domain/repositories/RuteaRepository'

export async function cargarMapa(repository: RuteaRepository, resumen: ResumenGrafo,
  signal?: AbortSignal): Promise<DatosMapa> {
  const cargarNodos = async () => {
    const nodos: Nodo[] = []
    const ids = new Set<string>()
    const limite = 2000 // Límite del endpoint; el dataset requiere más de una página.
    while (nodos.length < resumen.cantidadNodos) {
      signal?.throwIfAborted()
      const pagina = await repository.obtenerNodos(nodos.length, limite, signal)
      if (pagina.total !== resumen.cantidadNodos || pagina.nodos.length === 0 ||
          pagina.nodos.length > limite || nodos.length + pagina.nodos.length > pagina.total) {
        throw new Error('El dataset cambió o la paginación está incompleta. Actualiza el estado.')
      }
      for (const nodo of pagina.nodos) {
        if (ids.has(nodo.id)) throw new Error('La API devolvió nodos duplicados.')
        ids.add(nodo.id)
        nodos.push(nodo)
      }
    }
    return nodos
  }
  const [nodos, red] = await Promise.all([cargarNodos(), repository.obtenerRed(signal)])
  signal?.throwIfAborted()
  const ids = new Set(nodos.map(n => n.id))
  if (nodos.length === 0 || red.features.length !== resumen.cantidadAristas ||
      red.features.some(f => !ids.has(f.properties.origen) || !ids.has(f.properties.destino))) {
    throw new Error('La red vial no coincide con los nodos del dataset. Actualiza el estado.')
  }
  return { nodos, red }
}
