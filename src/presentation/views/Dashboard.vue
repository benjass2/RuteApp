<script setup lang="ts">
import Tag from 'primevue/tag'
import Sidebar from '@/presentation/components/sidebar/Sidebar.vue'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, watch } from 'vue'
import { useGrafoStore } from '@/application/stores/grafoStore'
import { usePlanificadorStore } from '@/application/stores/planificadorStore'
const MapViewer = defineAsyncComponent(() => import('@/presentation/components/map/MapViewer.vue'))

const grafo = useGrafoStore()
const plan = usePlanificadorStore()
watch(() => grafo.mapa, () => plan.limpiar())
const etiquetaConexion = computed(() => ({
  inicial: 'Conexión pendiente', cargando: 'Verificando conexión', listo: 'Dataset disponible',
  sin_dataset: 'Dataset no disponible', error: 'Consulta fallida',
})[grafo.estado])
onMounted(() => { void grafo.cargar() })
onBeforeUnmount(() => grafo.cancelar())
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <a class="brand" href="#main" aria-label="Rutea, ir al planificador"><span class="brand-symbol"><i class="pi pi-directions" aria-hidden="true" /></span>rutea<span class="brand-dot">.</span></a>
      <span class="header-caption">LOGÍSTICA URBANA, MEJOR CONECTADA</span>
      <Tag value="Lima, Perú" severity="secondary" icon="pi pi-map-marker" />
    </header>
    <main id="main" class="dashboard">
      <Sidebar />
      <section class="workspace" aria-labelledby="workspace-title">
        <div class="workspace-heading"><span class="eyebrow">PLANIFICADOR DE RUTAS</span><Tag :value="etiquetaConexion" severity="secondary" /></div>
        <h1 id="workspace-title" class="map-title">Miraflores + San Isidro</h1>
        <MapViewer />
        <footer class="workspace-footer"><span><i class="pi pi-sitemap" aria-hidden="true" /> Teoría de grafos aplicada a la ciudad</span><span>RUTEA / v1.0</span></footer>
      </section>
    </main>
    <footer class="app-footer"><span>Proyecto académico · Complejidad Algorítmica</span><span>Red vial: OpenStreetMap contributors</span></footer>
  </div>
</template>
