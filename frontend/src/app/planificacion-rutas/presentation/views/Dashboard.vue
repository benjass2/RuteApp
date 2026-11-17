<script setup lang="ts">
import Tag from 'primevue/tag'
import Sidebar from '@/app/planificacion-rutas/presentation/components/sidebar/Sidebar.vue'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, watch } from 'vue'
import { useGrafoStore } from '@/app/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
import MetricsPanel from '@/app/planificacion-rutas/presentation/components/metrics/MetricsPanel.vue'
import { useRutasStore } from '@/app/planificacion-rutas/application/stores/rutasStore'
import { useAnalisisStore } from '@/app/planificacion-rutas/application/stores/analisisStore'
const MapViewer = defineAsyncComponent(() => import('@/app/planificacion-rutas/presentation/components/map/MapViewer.vue'))

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

<style>
.app-shell {
    max-width: 1600px;
    margin: auto;
    padding: 0 36px;
}

.app-header {
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
}

.brand {
    display: flex;
    align-items: center;
    text-decoration: none;
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -.07em;
}

.brand-dot {
    color: #3f8d64;
}

.header-caption {
    font-size: .65rem;
    color: #7a877f;
    letter-spacing: .15em;
}

.dashboard {
    display: grid;
    grid-template-columns: 330px minmax(0, 1fr);
    gap: 22px;
    min-height: calc(100svh - 156px);
}

.workspace {
    min-height: 620px;
    height: max(620px, calc(100svh - 156px));
    position: sticky;
    top: 16px;
}

.workspace .map-title {
    font-size: 1.35rem;
    letter-spacing: -.03em;
    margin: 18px 0;
}

.workspace-footer {
    margin-top: 16px;
}

.workspace {
    display: flex;
    flex-direction: column;
    padding: 26px 30px;
    border: 1px solid #dce3d6;
    border-radius: 18px;
    background: radial-gradient(ellipse at 65% 45%, #e3edce 0, #f1f4e8 55%, #eaf0e2 100%);
}

.workspace-heading, .workspace-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.workspace h1 {
    font-size: clamp(2.4rem, 4.7vw, 4.8rem);
    line-height: 1.03;
    letter-spacing: -.065em;
    font-weight: 650;
    margin: 20px 0 24px;
}

.workspace h1 span {
    color: #718861;
}

.workspace-footer {
    border-top: 1px solid #d5dfcb;
    padding-top: 20px;
    font-size: .65rem;
    color: #7f8e74;
}

.workspace-footer i {
    margin-right: 7px;
}

.app-footer {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: .65rem;
    color: #8a958c;
    padding: 23px 0;
}

@media (max-width: 900px) {
    .app-shell {
        padding: 0 20px;
    }

    .header-caption {
        display: none;
    }

    .dashboard {
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 14px;
    }

    .workspace {
        padding: 22px 18px;
    }

    .workspace-heading {
        flex-wrap: wrap;
    }

    .workspace-footer {
        align-items: flex-start;
    }
}

@media (max-width: 640px) {
    .app-shell {
        padding: 0 14px;
    }

    .app-header {
        height: 80px;
    }

    .dashboard {
        grid-template-columns: 1fr;
    }

    .workspace-footer, .app-footer {
        flex-wrap: wrap;
    }
}

.app-shell {
    width: 100%;
    max-width: none;
    height: 100dvh;
    margin: 0;
    padding: 0 16px;
    display: grid;
    grid-template-rows: 72px minmax(0, 1fr) 32px;
}

.app-header {
    height: auto;
}

.dashboard {
    min-height: 0;
    min-width: 0;
    gap: 14px;
    grid-template-columns: 290px minmax(0, 1fr) 270px;
    grid-template-areas: 'controls map metrics';
}

.workspace {
    grid-area: map;
    position: relative;
    top: auto;
    min-height: 0;
    height: auto;
    min-width: 0;
    overflow: hidden;
    padding: 20px;
}

.workspace .map-title {
    margin: 14px 0;
}

.workspace-heading {
    flex-wrap: wrap;
    gap: 8px;
}

.workspace-footer {
    margin-top: 12px;
    padding-top: 12px;
}

.app-footer {
    padding: 0;
    align-items: center;
}

@media (min-width: 1700px) {
    .dashboard {
        grid-template-columns: 320px minmax(0, 1fr) 300px;
        gap: 18px;
    }
}

@media (max-width: 1199px) {
    .app-shell {
        height: auto;
        min-height: 100dvh;
        grid-template-rows: 72px auto 40px;
    }

    .dashboard {
        grid-template-columns: 280px minmax(0, 1fr);
        grid-template-areas: 'controls map' 'controls metrics';
        grid-template-rows: minmax(500px, 68dvh) auto;
    }

    .workspace {
        min-height: 500px;
        height: auto;
    }
}

@media (max-width: 759px) {
    .app-shell {
        padding: 0 10px;
        grid-template-rows: 68px auto auto;
    }

    .header-caption {
        display: none;
    }

    .dashboard {
        grid-template-columns: minmax(0, 1fr);
        grid-template-areas: 'controls' 'map' 'metrics';
        grid-template-rows: auto minmax(480px, 70dvh) auto;
    }

    .workspace {
        min-height: 480px;
        padding: 16px;
    }

    .app-footer {
        padding: 14px 0;
    }
}

@media (min-width: 1200px) and (max-height: 620px) {
    .app-shell {
        grid-template-rows: 56px minmax(0, 1fr) 26px;
    }

    .workspace {
        padding: 12px;
    }

    .workspace .map-title {
        margin: 8px 0;
        font-size: 1rem;
    }

    .workspace-footer {
        display: none;
    }
}
</style>
