<script setup lang="ts">
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
import { formatearHora } from '@/app/shared/domain/utils/formatearHora'
import GraphStatus from './GraphStatus.vue'
import RouteParameters from './RouteParameters.vue'
import AlgorithmSelector from './AlgorithmSelector.vue'
import GraphAnalysis from './GraphAnalysis.vue'

const store = usePlanificadorStore()
</script>

<template>
  <aside class="planner-panel" aria-label="Parámetros del planificador">
    <div class="section-heading"><span class="eyebrow">TU REPARTO</span><span class="step">01</span></div>
    <h2>Organiza tus<br />entregas por Lima.</h2>
    <p class="muted">Planifica el recojo y la entrega de comida, compras o paquetes.</p>
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

<style>
.planner-panel {
    background: #fff;
    padding: 30px 25px;
    border: 1px solid #e1e6df;
    border-radius: 18px;
}

.section-heading, .time-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.step {
    color: #a0aea3;
    font-size: .75rem;
}

.planner-panel h2 {
    font-size: 1.75rem;
    letter-spacing: -.055em;
    line-height: 1.16;
    margin: 27px 0 15px;
}

.mode-options {
    display: grid;
    gap: 10px;
    margin: 26px 0 38px;
}

.mode-options .p-button {
    justify-content: flex-start;
    padding: 13px 16px;
    font-size: .85rem;
}

.time-header {
    font-size: .83rem;
    margin-bottom: 24px;
}

.time-header strong {
    padding: 6px 10px;
    border-radius: 6px;
    background: #eff5ed;
    font-variant-numeric: tabular-nums;
}

.time-range {
    display: flex;
    justify-content: space-between;
    color: #839086;
    font-size: .7rem;
    margin-top: 14px;
}

.simulation-note {
    display: flex;
    gap: 8px;
    font-size: .72rem;
    line-height: 1.6;
    color: #7b887e;
    margin: 23px 0 0;
}

.simulation-note i {
    margin-top: 3px;
}

.planner-panel {
    max-height: max(620px, calc(100svh - 156px));
    overflow-y: auto;
}

@media (max-width: 640px) {

    .planner-panel {
        padding: 24px;
    }

    .planner-panel h2 {
        margin-top: 20px;
    }

    .mode-options {
        grid-template-columns: 1fr 1fr;
        margin-bottom: 25px;
    }

    .mode-options .p-button {
        font-size: .75rem;
        padding: 12px 8px;
        justify-content: center;
    }
}

@media (max-width: 640px) {
    .planner-panel {
        max-height: none;
    }
}

.planner-panel {
    grid-area: controls;
    min-height: 0;
    max-height: none;
    overflow-y: auto;
    padding: 24px 20px;
}

@media (max-width: 1199px) {

    .planner-panel {
        align-self: start;
        max-height: calc(100dvh - 88px);
        position: sticky;
        top: 12px;
    }
}

@media (max-width: 759px) {

    .planner-panel {
        position: static;
        max-height: none;
    }
}
</style>
