import { defineStore } from 'pinia'
import { ref, shallowRef, inject, watch, onScopeDispose } from 'vue'
import { ruteaRepositoryKey } from '@/application/ports/dependencies'
import { useGrafoStore } from './grafoStore'
import { usePlanificadorStore } from './planificadorStore'
import type { Conectividad, RedMST, Sector } from '@/domain/models/analisis'

/** Petición cancelable con caché de sesión y protección frente a respuestas obsoletas. */
function recurso<T>(leer: (signal: AbortSignal) => Promise<T>) {
  const datos = shallowRef<T | null>(null)
  const cargando = ref(false)
  const error = ref('')
  let actual: AbortController | null = null
  function cancelar() { actual?.abort(); actual = null; cargando.value = false }
  function limpiar() { cancelar(); datos.value = null; error.value = '' }
  async function cargar() {
    if (datos.value || cargando.value) return
    const controller = new AbortController()
    actual = controller; cargando.value = true; error.value = ''
    try {
      const data = await leer(controller.signal)
      if (actual === controller) datos.value = data
    } catch (e) {
      if (actual === controller && !controller.signal.aborted) error.value = e instanceof Error ? e.message : 'No se pudo consultar el análisis.'
    } finally {
      if (actual === controller) { actual = null; cargando.value = false }
    }
  }
  return { datos, cargando, error, cargar, cancelar, limpiar }
}

export const useAnalisisStore = defineStore('analisis', () => {
  const dependency = inject(ruteaRepositoryKey)
  if (!dependency) throw new Error('RuteaRepository no está configurado.')
  const repo = dependency
  const grafo = useGrafoStore()
  const plan = usePlanificadorStore()
  const mstVisible = ref(false), sectoresVisibles = ref(false)
  const mst = recurso<RedMST>(async signal => {
    const mapa = grafo.mapa
    if (!mapa) throw new Error('Carga primero la red vial.')
    const data = await repo.obtenerMST(signal)
    const ids = new Set(mapa.nodos.map(n => n.id))
    if (data.nodos !== ids.size || data.red.features.some(f => !ids.has(f.properties.origen) || !ids.has(f.properties.destino))) {
      throw new Error('La red MST no coincide con el dataset actual.')
    }
    return data
  })
  const sectores = recurso<Sector[]>(async signal => {
    const mapa = grafo.mapa
    if (!mapa) throw new Error('Carga primero la red vial.')
    const data = await repo.obtenerSectores(signal)
    const ids = new Set(mapa.nodos.map(n => n.id))
    const todos = data.flatMap(s => s.nodos)
    if (todos.length !== ids.size || todos.some(id => !ids.has(id))) throw new Error('Los sectores no cubren el dataset actual.')
    return data
  })
  const ufds = recurso<Conectividad>(signal => {
    if (!plan.origen || !plan.destinos.length) throw new Error('Selecciona depósito y destinos para verificar conectividad.')
    return repo.verificarConectividad(plan.origen.id, plan.destinos.map(n => n.id), signal)
  })

  async function cambiarMST(visible: boolean) {
    mstVisible.value = visible
    if (!visible) { mst.cancelar(); return }
    await mst.cargar()
    if (mst.error.value) mstVisible.value = false
  }
  async function cambiarSectores(visible: boolean) {
    sectoresVisibles.value = visible
    if (!visible) { sectores.cancelar(); return }
    await sectores.cargar()
    if (sectores.error.value) sectoresVisibles.value = false
  }
  function limpiar() {
    mstVisible.value = false; sectoresVisibles.value = false
    mst.limpiar(); sectores.limpiar(); ufds.limpiar()
  }
  watch(() => grafo.mapa, limpiar, { flush: 'sync' })
  watch(() => [plan.origen?.id, ...plan.destinos.map(n => n.id)], ufds.limpiar, { flush: 'sync' })
  onScopeDispose(limpiar)
  return { mst: mst.datos, mstCargando: mst.cargando, errorMST: mst.error,
    sectores: sectores.datos, sectoresCargando: sectores.cargando, errorSectores: sectores.error,
    conectividad: ufds.datos, ufdsCargando: ufds.cargando, errorUFDS: ufds.error,
    verificarUFDS: ufds.cargar, mstVisible, sectoresVisibles, cambiarMST, cambiarSectores, limpiar }
})
