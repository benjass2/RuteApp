<script setup lang="ts">
import { ref } from 'vue'
import Button from 'primevue/button'
import Slider from 'primevue/slider'
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
import { formatearHora } from '@/app/shared/domain/utils/formatearHora'
import RouteParameters from './RouteParameters.vue'
import AlgorithmSelector from './AlgorithmSelector.vue'

const abierto = ref(false)
const store = usePlanificadorStore()
</script>

<template>
  <aside class="planner-panel hud-surface" aria-label="Parámetros del planificador">
    <h2>Planifica tu reparto</h2>
    <button class="planner-toggle" type="button" :aria-expanded="abierto" aria-controls="planner-content" @click="abierto = !abierto">
      Planifica tu reparto <i class="pi" :class="abierto ? 'pi-chevron-down' : 'pi-chevron-up'" aria-hidden="true" />
    </button>
    <div id="planner-content" :class="{ 'planner-expanded': abierto }">
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
    <p class="simulation-note"><i class="pi pi-info-circle" aria-hidden="true" /> La hora de salida fija el tráfico simulado para todos los tramos del reparto.</p>
    <RouteParameters />
    <AlgorithmSelector />
    </div>
  </aside>
</template>

<style>
.planner-panel {
  position: absolute;
  z-index: 1150;
  top: var(--hud-top);
  left: var(--hud-gap);
  width: var(--planner-width);
  max-height: calc(100% - var(--hud-top) - 44px);
  padding: 18px;
  overflow: auto;
  scrollbar-width: none;
  overscroll-behavior-y: contain;
}
.planner-panel::-webkit-scrollbar { display: none; }
.planner-panel h2 { margin: 0 0 16px; font-size: 1.12rem; letter-spacing: -.02em; }
.mode-options { display: flex; gap: 4px; padding: 4px; border-radius: 10px; background: #eaf1ed; }
.mode-options .p-button { flex: 1; padding: 8px 5px; font-size: .78rem; white-space: nowrap; }
.mode-options .p-button[aria-pressed="true"] { background: #087452; border-color: #087452; }
.mode-options .p-button[aria-pressed="false"] { background: transparent; border-color: transparent; color: #314a40; }
.time-header, .time-range { display: flex; justify-content: space-between; align-items: center; }
.time-header { margin: 17px 0 12px; font-size: .85rem; }
.time-header strong, .time-range { font-variant-numeric: tabular-nums; }
.time-range { margin-top: 9px; color: #43594f; font-size: .68rem; }
.simulation-note { margin: 8px 0; color: #43594f; font-size: .72rem; }
.planner-toggle { display: none; }
@media (max-width: 840px) {
  .planner-panel { inset: auto 10px 28px; width: auto; max-height: 48dvh; padding: 12px 16px; }
  .planner-panel h2, #planner-content:not(.planner-expanded) { display: none; }
  .planner-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 36px;
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  .planner-expanded { padding-top: 10px; }
}
</style>
