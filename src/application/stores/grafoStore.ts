import { defineStore } from 'pinia'
import { inject, ref, shallowRef } from 'vue'
import type { ResumenGrafo, DatosMapa } from '@/domain/models/grafo'
import { ruteaRepositoryKey } from '@/application/ports/dependencies'
import { cargarEstadoGrafo } from '@/application/use-cases/cargarGrafo'
import { cargarMapa } from '@/application/use-cases/cargarMapa'

export const useGrafoStore = defineStore('grafo', () => {
  const dependency = inject(ruteaRepositoryKey)
  if (!dependency) throw new Error('RuteaRepository no está configurado.')
  const repository = dependency
  const estado = ref<'inicial' | 'cargando' | 'listo' | 'sin_dataset' | 'error'>('inicial')
  const resumen = shallowRef<ResumenGrafo | null>(null)
  const mensajeError = ref('')
  let solicitud: AbortController | null = null
  const mapa = shallowRef<DatosMapa | null>(null)
  const estadoMapa = ref<'inicial' | 'cargando' | 'listo' | 'error'>('inicial')
  const errorMapa = ref('')
  let solicitudMapa: AbortController | null = null

  async function cargarRed() {
    if (!resumen.value || estado.value !== 'listo') return
    solicitudMapa?.abort()
    const actual = new AbortController()
    solicitudMapa = actual
    mapa.value = null
    estadoMapa.value = 'cargando'
    errorMapa.value = ''
    try {
      const data = await cargarMapa(repository, resumen.value, actual.signal)
      if (solicitudMapa !== actual) return
      mapa.value = data
      estadoMapa.value = 'listo'
    } catch (error) {
      if (solicitudMapa !== actual || actual.signal.aborted) return
      actual.abort() // Cancelar la otra lectura concurrente si una de ellas falló.
      estadoMapa.value = 'error'
      errorMapa.value = error instanceof Error ? error.message : 'No se pudo cargar el mapa.'
    } finally {
      if (solicitudMapa === actual) solicitudMapa = null
    }
  }

  function cancelar() {
    solicitudMapa?.abort()
    solicitudMapa = null
    if (estadoMapa.value === 'cargando') estadoMapa.value = 'inicial'
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
    mapa.value = null
    estadoMapa.value = 'inicial'
    mensajeError.value = ''
    try {
      const resultado = await cargarEstadoGrafo(repository, actual.signal)
      if (solicitud !== actual) return
      if (resultado.tipo === 'listo') resumen.value = resultado.resumen
      estado.value = resultado.tipo
      if (resultado.tipo === 'listo') await cargarRed()
    } catch (error) {
      if (solicitud !== actual || actual.signal.aborted) return
      estado.value = 'error'
      mensajeError.value = error instanceof Error ? error.message : 'Ocurrió un error al cargar el grafo.'
    } finally {
      if (solicitud === actual) solicitud = null
    }
  }

  return { estado, resumen, mensajeError, cargar, cancelar, mapa, estadoMapa, errorMapa, cargarRed }
})
