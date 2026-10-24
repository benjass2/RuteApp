import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { ParametrosPlanificador, TipoRecorrido } from '@/domain/models/planificador'

export const usePlanificadorStore = defineStore('planificador', () => {
  const parametros = reactive<ParametrosPlanificador>({
    tipoRecorrido: 'punto_a_punto',
    minutoDia: 480,
  })

  function cambiarTipo(tipo: TipoRecorrido) {
    parametros.tipoRecorrido = tipo
  }

  function cambiarMinuto(minuto: number) {
    if (!Number.isInteger(minuto) || minuto < 0 || minuto > 1439) return
    parametros.minutoDia = minuto
  }

  return { parametros, cambiarTipo, cambiarMinuto }
})
