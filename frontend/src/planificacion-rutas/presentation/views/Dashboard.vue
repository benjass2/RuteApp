<script setup lang="ts">
import '../styles/layout.css'
import '../styles/dashboard.css'
import Tag from 'primevue/tag'
import Sidebar from '@/planificacion-rutas/presentation/components/sidebar/Sidebar.vue'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, watch } from 'vue'
import { useGrafoStore } from '@/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import MetricsPanel from '@/planificacion-rutas/presentation/components/metrics/MetricsPanel.vue'
import { useRutasStore } from '@/planificacion-rutas/application/stores/rutasStore'
import { useAnalisisStore } from '@/planificacion-rutas/application/stores/analisisStore'
const MapViewer = defineAsyncComponent(() => import('@/planificacion-rutas/presentation/components/map/MapViewer.vue'))

const grafo = useGrafoStore()
const plan = usePlanificadorStore()
const rutas = useRutasStore()
const analisis = useAnalisisStore()
watch(() => grafo.mapa, () => plan.limpiar())
const etiquetaConexion = computed(() => ({
  inicial: 'Conexión pendiente', cargando: 'Verificando conexión', listo: 'Dataset disponible',
  sin_dataset: 'Dataset no disponible', error: 'Consulta fallida',
})[grafo.estado])
onMounted(() => { void grafo.cargar() })
onBeforeUnmount(() => { grafo.cancelar(); rutas.limpiar(); analisis.limpiar() })
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <a class="brand" href="#main" aria-label="Rutea, ir al planificador">RuteApp<span class="brand-dot"></span></a>
      <span class="header-caption">CADA PEDIDO, UNA RUTA</span>
      <Tag value="Lima, Perú" severity="secondary" icon="pi pi-map-marker" />
    </header>
    <main id="main" class="dashboard">
      <Sidebar />
      <section class="workspace" aria-labelledby="workspace-title">
        <div class="workspace-heading"><span class="eyebrow">PLANIFICADOR DE DELIVERY</span><Tag :value="etiquetaConexion" severity="secondary" /></div>
        <h1 id="workspace-title" class="map-title">Miraflores + San Isidro</h1>
        <MapViewer />
        <footer class="workspace-footer"><span><i class="pi pi-sitemap" aria-hidden="true" /> Rutas para tus pedidos y entregas</span><span>RUTEA / v1.0</span></footer>
      </section>
      <MetricsPanel />
    </main>
    <footer class="app-footer"><span>Proyecto académico · Complejidad Algorítmica</span><span>Red vial: OpenStreetMap contributors</span></footer>
  </div>
</template>
