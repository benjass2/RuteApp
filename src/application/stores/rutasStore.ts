import { defineStore } from 'pinia'
import { computed, inject, ref, shallowRef, watch, onScopeDispose } from 'vue'
import { ruteaRepositoryKey } from '@/application/ports/dependencies'
import { usePlanificadorStore } from './planificadorStore'
import { calcularRuta, validarSolicitudRuta } from '@/application/use-cases/calcularRuta'
import type { ResultadoRuta, SolicitudRuta, ComparacionRutas } from '@/domain/models/ruta'

export const useRutasStore = defineStore('rutas', () => {
  const dependency = inject(ruteaRepositoryKey)
  if (!dependency) throw new Error('RuteaRepository no está configurado.')
  const repository = dependency
  const plan = usePlanificadorStore()
  const estado = ref<'inicial' | 'cargando' | 'listo' | 'error'>('inicial')
  const resultado = shallowRef<ResultadoRuta | null>(null)
  const comparacion = shallowRef<ComparacionRutas | null>(null)
  const operacion = ref<'calculo' | 'comparacion'>('calculo')
  const error = ref('')
  let actual: AbortController | null = null
  const solicitud = computed<SolicitudRuta>(() => plan.parametros.tipoRecorrido === 'punto_a_punto'
    ? { tipo: 'punto_a_punto', origen: plan.origen?.id ?? '', destino: plan.destinos[0]?.id ?? '',
        minutoDia: plan.parametros.minutoDia, algoritmo: plan.algoritmoPunto }
    : { tipo: 'multi_entrega', origen: plan.origen?.id ?? '', destinos: plan.destinos.map(n => n.id),
        minutoDia: plan.parametros.minutoDia, algoritmo: plan.algoritmoMulti, volverOrigen: plan.volverOrigen })
  const motivoBloqueo = computed(() => {
    try { validarSolicitudRuta(solicitud.value); return '' } catch (e) {
      return e instanceof Error ? e.message : 'Revisa los parámetros.'
    }
  })
  const motivoComparacion = computed(() => motivoBloqueo.value ||
    (plan.parametros.tipoRecorrido === 'multi_entrega' && plan.destinos.length > 8 ? 'La comparación admite hasta 8 entregas.' : ''))

  function limpiar() {
    actual?.abort()
    actual = null
    resultado.value = null
    comparacion.value = null
    estado.value = 'inicial'
    error.value = ''
  }
  // Flush sync invalida el resultado incluso si una respuesta llega en el mismo turno.
  watch(solicitud, limpiar, { flush: 'sync' })
  onScopeDispose(limpiar)

  async function ejecutar(comparar: boolean) {
    limpiar()
    const motivo = comparar ? motivoComparacion.value : motivoBloqueo.value
    if (motivo) { error.value = motivo; estado.value = 'error'; return }
    const controller = new AbortController()
    actual = controller
    estado.value = 'cargando'
    operacion.value = comparar ? 'comparacion' : 'calculo'
    try {
      const data = comparar ? await repository.compararRutas(solicitud.value, controller.signal)
        : await calcularRuta(repository, solicitud.value, controller.signal)
      if (actual !== controller) return
      if ('resultados' in data) {
        comparacion.value = data
        resultado.value = data.resultados.find(r => r.algoritmo === solicitud.value.algoritmo) ?? data.resultados[0]
      } else resultado.value = data
      estado.value = 'listo'
    } catch (e) {
      if (actual !== controller || controller.signal.aborted) return
      error.value = e instanceof Error ? e.message : 'No se pudo calcular la ruta. Intenta nuevamente.'
      estado.value = 'error'
    } finally {
      if (actual === controller) actual = null
    }
  }
  function mostrarResultado(algoritmo: ResultadoRuta['algoritmo']) {
    const ruta = comparacion.value?.resultados.find(r => r.algoritmo === algoritmo)
    if (ruta) resultado.value = ruta
  }
  const calcular = () => ejecutar(false)
  const comparar = () => ejecutar(true)
  return { estado, resultado, comparacion, operacion, error, motivoBloqueo, motivoComparacion,
    calcular, comparar, mostrarResultado, limpiar }
})
