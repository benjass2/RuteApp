<script setup lang="ts">
import Tag from 'primevue/tag'
import Sidebar from '@/presentation/components/sidebar/Sidebar.vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { useGrafoStore } from '@/application/stores/grafoStore'

const grafo = useGrafoStore()
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
        <div class="workspace-heading"><span class="eyebrow">PLANIFICADOR DE RUTAS</span><Tag :value="grafo.estado === 'listo' ? 'Dataset disponible' : 'Verificando conexión'" severity="secondary" /></div>
        <div class="workspace-content">
          <div class="location-icon"><i class="pi pi-map" aria-hidden="true" /></div>
          <span class="eyebrow">MIRAFLORES + SAN ISIDRO</span>
          <h1 id="workspace-title">Menos vueltas.<br /><span>Más posibilidades.</span></h1>
          <p>Un espacio para explorar la red vial y encontrar mejores recorridos, una entrega a la vez.</p>
          <div class="stage-label">Mapa interactivo en la siguiente etapa</div>
        </div>
        <footer class="workspace-footer"><span><i class="pi pi-sitemap" aria-hidden="true" /> Teoría de grafos aplicada a la ciudad</span><span>RUTEA / v1.0</span></footer>
      </section>
    </main>
    <footer class="app-footer"><span>Proyecto académico · Complejidad Algorítmica</span><span>Red vial: OpenStreetMap contributors</span></footer>
  </div>
</template>
