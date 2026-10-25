<script setup lang="ts">
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import { formatearHora } from '@/shared/domain/utils/formatearHora'
import GraphStatus from './GraphStatus.vue'
import RouteParameters from './RouteParameters.vue'
import AlgorithmSelector from './AlgorithmSelector.vue'
import GraphAnalysis from './GraphAnalysis.vue'
import { useGrafoStore } from '@/planificacion-rutas/application/stores/grafoStore'
import { zonas, type ZonaId } from '@/planificacion-rutas/domain/models/zona'

const store = usePlanificadorStore()
const grafo = useGrafoStore()
function seleccionarZona(event: Event) {
  void grafo.cambiarZona((event.target as HTMLSelectElement).value as ZonaId)
}
</script>

<template>
  <aside class="planner-panel" aria-label="Parámetros del planificador">
    <div class="section-heading"><span class="eyebrow">TU REPARTO</span><span class="step">01</span></div>
    <h2>Organiza tus<br />entregas por Lima.</h2>
    <p class="muted">Planifica el recojo y la entrega de comida, compras o paquetes.</p>
    <label for="zona-trabajo">Zona de reparto</label>
    <select id="zona-trabajo" class="zone-select" :value="grafo.zona" @change="seleccionarZona">
      <option v-for="zona in zonas" :key="zona.id" :value="zona.id">{{ zona.nombre }}</option>
    </select>
    <div class="mode-options" role="group" aria-label="Tipo de recorrido">
      <Button label="Un pedido" icon="pi pi-map-marker"
        :outlined="store.parametros.tipoRecorrido !== 'punto_a_punto'"
        :aria-pressed="store.parametros.tipoRecorrido === 'punto_a_punto'"
        @click="store.cambiarTipo('punto_a_punto')" />
      <Button label="Varios pedidos" icon="pi pi-box"
        :outlined="store.parametros.tipoRecorrido !== 'multi_entrega'"
        :aria-pressed="store.parametros.tipoRecorrido === 'multi_entrega'"
        @click="store.cambiarTipo('multi_entrega')" />
    </div>
    <div class="time-header"><label id="hora-label">Hora de salida</label><strong>{{ formatearHora(store.parametros.minutoDia) }}</strong></div>
    <Slider :model-value="store.parametros.minutoDia" :min="0" :max="1439" :step="1"
      aria-labelledby="hora-label"
      @update:model-value="value => { if (typeof value === 'number') store.cambiarMinuto(value) }" />
    <div class="time-range"><span>00:00</span><span>23:59</span></div>
    <p class="simulation-note"><i class="pi pi-info-circle" aria-hidden="true" /> Tráfico horario simulado con fines académicos.</p>
    <GraphStatus />
    <GraphAnalysis />
    <RouteParameters />
    <AlgorithmSelector />
  </aside>
</template>
