<script setup lang="ts">
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import { formatearHora } from '@/shared/domain/utils/formatearHora'
import GraphStatus from './GraphStatus.vue'
import RouteParameters from './RouteParameters.vue'
import AlgorithmSelector from './AlgorithmSelector.vue'
import GraphAnalysis from './GraphAnalysis.vue'

const store = usePlanificadorStore()
</script>

<template>
  <aside class="planner-panel" aria-label="Parámetros del planificador">
    <div class="section-heading"><span class="eyebrow">TU RECORRIDO</span><span class="step">01</span></div>
    <h2>Todo empieza<br />con una buena ruta.</h2>
    <p class="muted">Elige cómo quieres organizar tu recorrido por Lima.</p>
    <div class="mode-options" role="group" aria-label="Tipo de recorrido">
      <Button label="Punto a punto" icon="pi pi-map-marker"
        :outlined="store.parametros.tipoRecorrido !== 'punto_a_punto'"
        :aria-pressed="store.parametros.tipoRecorrido === 'punto_a_punto'"
        @click="store.cambiarTipo('punto_a_punto')" />
      <Button label="Multi-entrega" icon="pi pi-box"
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
