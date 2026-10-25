<script setup lang="ts">
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { computed } from 'vue'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import { useRutasStore } from '@/planificacion-rutas/application/stores/rutasStore'
import { useGrafoStore } from '@/planificacion-rutas/application/stores/grafoStore'

const plan = usePlanificadorStore()
const rutas = useRutasStore()
const grafo = useGrafoStore()
const opcionesPunto = [{ value: 'dijkstra', label: 'Dijkstra', detalle: 'Cola de prioridad · O((V + E) log V)' },
  { value: 'bellman_ford', label: 'Bellman-Ford', detalle: 'Relajación de aristas · O(V E)' }]
const opcionesMulti = [{ value: 'held_karp', label: 'Held-Karp', detalle: 'Programación dinámica · hasta 12 entregas' },
  { value: 'backtracking', label: 'Backtracking', detalle: 'Fuerza bruta con poda · hasta 8 entregas' }]
const motivo = computed(() => grafo.estadoMapa !== 'listo' ? 'Espera a que la red vial esté disponible.' : rutas.motivoBloqueo)
</script>

<template>
  <section class="algorithm-section" aria-labelledby="algorithm-title">
    <h3 id="algorithm-title">Motor de rutas</h3>
    <fieldset class="algorithm-options">
      <legend class="sr-only">Algoritmo para calcular el recorrido</legend>
      <template v-if="plan.parametros.tipoRecorrido === 'punto_a_punto'">
        <label v-for="opcion in opcionesPunto" :key="opcion.value" :for="opcion.value" class="algorithm-option">
          <RadioButton v-model="plan.algoritmoPunto" :input-id="opcion.value" name="algoritmo-punto" :value="opcion.value" />
          <span><strong>{{ opcion.label }}</strong><small>{{ opcion.detalle }}</small></span>
        </label>
      </template>
      <template v-else>
        <label v-for="opcion in opcionesMulti" :key="opcion.value" :for="opcion.value" class="algorithm-option">
          <RadioButton v-model="plan.algoritmoMulti" :input-id="opcion.value" name="algoritmo-multi" :value="opcion.value" />
          <span><strong>{{ opcion.label }}</strong><small>{{ opcion.detalle }}</small></span>
        </label>
      </template>
    </fieldset>
    <label v-if="plan.parametros.tipoRecorrido === 'multi_entrega'" for="volver-origen" class="return-option">
      <Checkbox v-model="plan.volverOrigen" input-id="volver-origen" binary />Volver al punto de recojo
    </label>
    <p id="route-guidance" class="route-guidance">{{ motivo || 'Todo listo para calcular con el tráfico de la hora seleccionada.' }}</p>
    <Button :label="rutas.estado === 'error' ? 'Reintentar cálculo' : 'Calcular ruta óptima'" icon="pi pi-directions"
      class="calculate-button" :loading="rutas.estado === 'cargando' && rutas.operacion === 'calculo'" :disabled="!!motivo || rutas.estado === 'cargando'"
      aria-describedby="route-guidance" @click="rutas.calcular()" />
    <Button label="Comparar algoritmos" icon="pi pi-chart-bar" outlined class="compare-button"
      :loading="rutas.estado === 'cargando' && rutas.operacion === 'comparacion'"
      :disabled="grafo.estadoMapa !== 'listo' || !!rutas.motivoComparacion || rutas.estado === 'cargando'"
      aria-describedby="comparison-guidance" @click="rutas.comparar()" />
    <p id="comparison-guidance" class="analysis-note">{{ rutas.motivoComparacion || (plan.parametros.tipoRecorrido === 'punto_a_punto' ? 'Compara Dijkstra y Bellman-Ford con los mismos puntos y hora.' : 'Compara Held-Karp y backtracking con una matriz compartida.') }}</p>
    <Button v-if="rutas.estado === 'cargando'" label="Cancelar cálculo" text severity="secondary" @click="rutas.limpiar()" />
    <Message v-if="rutas.error" severity="error" :closable="false" class="route-error">{{ rutas.error }}</Message>
  </section>
</template>
