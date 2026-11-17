<script setup lang="ts">
import Button from 'primevue/button'
import GraphStatus from '../components/sidebar/GraphStatus.vue'
import GraphAnalysis from '../components/sidebar/GraphAnalysis.vue'
import Sidebar from '@/app/planificacion-rutas/presentation/components/sidebar/Sidebar.vue'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGrafoStore } from '@/app/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
import MetricsPanel from '@/app/planificacion-rutas/presentation/components/metrics/MetricsPanel.vue'
import { useRutasStore } from '@/app/planificacion-rutas/application/stores/rutasStore'
import { useAnalisisStore } from '@/app/planificacion-rutas/application/stores/analisisStore'
const Dialog = defineAsyncComponent(() => import('primevue/dialog'))
const MapViewer = defineAsyncComponent(() => import('@/app/planificacion-rutas/presentation/components/map/MapViewer.vue'))

const grafo = useGrafoStore()
const plan = usePlanificadorStore()
const rutas = useRutasStore()
const analisis = useAnalisisStore()
watch(() => grafo.mapa, () => plan.limpiar())
const redAbierta = ref(false)
const paso = computed(() => !plan.origen || plan.seleccionActiva === 'origen' ? 1 : !plan.destinos.length ? 2 : 3)
const instrucciones = computed(() => [
  'Selecciona el recojo',
  'Selecciona una entrega',
  plan.parametros.tipoRecorrido === 'multi_entrega' ? 'Calcula la ruta o agrega entregas' : 'Calcula la ruta',
])
onMounted(() => { void grafo.cargar() })
onBeforeUnmount(() => { grafo.cancelar(); rutas.limpiar(); analisis.limpiar() })
</script>

<template>
  <main class="route-workspace">
    <MapViewer />
    <header class="route-header hud-surface">
      <strong>RuteApp</strong>
      <span>Miraflores · San Isidro</span>
      <Button label="Red vial" icon="pi pi-sitemap" size="small" severity="secondary" @click="redAbierta = true" />
    </header>
    <div v-if="grafo.estadoMapa === 'listo' && !rutas.resultado" class="route-step hud-surface" role="status">
      <span class="route-step-number">{{ paso }}</span>
      {{ instrucciones[paso - 1] }}
    </div>
    <Sidebar />
    <MetricsPanel />
    <Dialog v-if="redAbierta" v-model:visible="redAbierta" modal header="Red vial" :style="{ width: '28rem', maxWidth: 'calc(100vw - 24px)' }">
      <GraphStatus />
      <GraphAnalysis />
    </Dialog>
  </main>
</template>

<style>
.route-workspace {
  --hud-gap: 16px;
  --hud-top: 76px;
  --planner-width: 316px;
  --result-width: 280px;
  position: relative;
  isolation: isolate;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  color: #162b24;
}
.hud-surface {
  border: 1px solid rgba(0, 0, 0, .08);
  border-radius: 16px;
  background: rgba(255, 255, 255, .94);
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 28px rgba(24, 52, 44, .13);
}
.route-header, .route-step {
  position: absolute;
  z-index: 1200;
  top: var(--hud-gap);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  min-height: 44px;
}
.route-header { left: var(--hud-gap); }
.route-header strong { color: #07553e; letter-spacing: -.035em; font-size: 1.15rem; }
.route-header > span { font-size: .75rem; color: #40584f; }
.route-step { left: 50%; transform: translateX(-50%); font-size: .9375rem; font-weight: 650; }
.route-step-number {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #fff;
  background: #087452;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 1400px) {
  .route-step { top: var(--hud-top); }
}
@media (max-width: 840px) {
  .route-workspace { --hud-gap: 10px; --hud-top: 62px; }
  .route-header { right: var(--hud-gap); }
  .route-header .p-button { margin-left: auto; }
  .route-step { top: 114px; width: max-content; max-width: calc(100% - 24px); }
}
@media (max-width: 420px) {
  .route-step { top: 150px; }
}
</style>
