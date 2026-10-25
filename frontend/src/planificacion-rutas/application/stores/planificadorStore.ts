import { defineStore } from 'pinia'
import { reactive, ref, shallowRef } from 'vue'
import type { Nodo } from '@/planificacion-rutas/domain/models/grafo'
import type { AlgoritmoPunto, AlgoritmoMulti } from '@/planificacion-rutas/domain/models/ruta'
import type { ParametrosPlanificador, TipoRecorrido } from '@/planificacion-rutas/domain/models/planificador'

export const usePlanificadorStore = defineStore('planificador', () => {
  const parametros = reactive<ParametrosPlanificador>({
    tipoRecorrido: 'punto_a_punto',
    minutoDia: 480,
  })
  const origen = shallowRef<Nodo | null>(null)
  const destinos = shallowRef<Nodo[]>([])
  const seleccionActiva = ref<'origen' | 'destino'>('origen')
  const errorSeleccion = ref('')
  const algoritmoPunto = ref<AlgoritmoPunto>('dijkstra')
  const algoritmoMulti = ref<AlgoritmoMulti>('held_karp')
  const volverOrigen = ref(true)

  function seleccionarNodo(nodo: Nodo) {
    errorSeleccion.value = ''
    if (seleccionActiva.value === 'origen') {
      origen.value = nodo
      destinos.value = destinos.value.filter(d => d.id !== nodo.id)
      seleccionActiva.value = 'destino'
      return
    }
    if (nodo.id === origen.value?.id) {
      errorSeleccion.value = 'El destino debe ser distinto del depósito.'
      return
    }
    if (parametros.tipoRecorrido === 'punto_a_punto') {
      destinos.value = [nodo]
      return
    }
    if (destinos.value.some(d => d.id === nodo.id)) {
      errorSeleccion.value = 'Esa parada ya está seleccionada.'
      return
    }
    if (destinos.value.length >= 12) {
      errorSeleccion.value = 'Puedes seleccionar hasta 12 entregas.'
      return
    }
    destinos.value = [...destinos.value, nodo]
  }

  function quitarDestino(id: string) {
    destinos.value = destinos.value.filter(d => d.id !== id)
    errorSeleccion.value = ''
  }

  function limpiar() {
    origen.value = null
    destinos.value = []
    seleccionActiva.value = 'origen'
    errorSeleccion.value = ''
  }

  function cambiarTipo(tipo: TipoRecorrido) {
    parametros.tipoRecorrido = tipo
    errorSeleccion.value = ''
    if (tipo === 'punto_a_punto') destinos.value = destinos.value.slice(0, 1)
  }

  function cambiarMinuto(minuto: number) {
    if (!Number.isInteger(minuto) || minuto < 0 || minuto > 1439) return
    parametros.minutoDia = minuto
  }

  return { parametros, cambiarTipo, cambiarMinuto, origen, destinos, seleccionActiva,
    errorSeleccion, seleccionarNodo, quitarDestino, limpiar, algoritmoPunto, algoritmoMulti, volverOrigen }
})
