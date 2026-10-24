import { defineStore } from 'pinia'
import { inject, ref, shallowRef } from 'vue'
import type { ResumenGrafo } from '@/domain/models/grafo'
import { ruteaRepositoryKey } from '@/application/ports/dependencies'
import { cargarEstadoGrafo } from '@/application/use-cases/cargarGrafo'

export const useGrafoStore = defineStore('grafo', () => {
  const dependency = inject(ruteaRepositoryKey)
  if (!dependency) throw new Error('RuteaRepository no está configurado.')
  const repository = dependency
  const estado = ref<'inicial' | 'cargando' | 'listo' | 'sin_dataset' | 'error'>('inicial')
  const resumen = shallowRef<ResumenGrafo | null>(null)
  const mensajeError = ref('')
  let solicitud: AbortController | null = null

  function cancelar() {
    solicitud?.abort()
    solicitud = null
    if (estado.value === 'cargando') estado.value = 'inicial'
  }

  async function cargar() {
    cancelar()
    const actual = new AbortController()
    solicitud = actual
    estado.value = 'cargando'
    resumen.value = null
    mensajeError.value = ''
    try {
      const resultado = await cargarEstadoGrafo(repository, actual.signal)
      if (solicitud !== actual) return
      if (resultado.tipo === 'listo') resumen.value = resultado.resumen
      estado.value = resultado.tipo
    } catch (error) {
      if (solicitud !== actual || actual.signal.aborted) return
      estado.value = 'error'
      mensajeError.value = error instanceof Error ? error.message : 'Ocurrió un error al cargar el grafo.'
    } finally {
      if (solicitud === actual) solicitud = null
    }
  }

  return { estado, resumen, mensajeError, cargar, cancelar }
})
