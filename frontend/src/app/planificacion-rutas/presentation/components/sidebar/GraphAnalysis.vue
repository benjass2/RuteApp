<script setup lang="ts">
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAnalisisStore } from '@/app/planificacion-rutas/application/stores/analisisStore'
import { useGrafoStore } from '@/app/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
import { coloresSectores } from '@/app/planificacion-rutas/presentation/components/map/sectores'

const analisis = useAnalisisStore()
const grafo = useGrafoStore()
const plan = usePlanificadorStore()
const formato = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 })
</script>

<template>
  <details class="graph-analysis">
    <summary>Análisis del grafo</summary>
    <div class="analysis-content">
      <label for="mst-visible" class="analysis-toggle"><Checkbox input-id="mst-visible" binary
        :model-value="analisis.mstVisible" :disabled="grafo.estadoMapa !== 'listo'"
        @update:model-value="value => analisis.cambiarMST(!!value)" />Red troncal MST</label>
      <p class="analysis-note">Kruskal sobre calles sin dirección, con longitud física como peso. No es una ruta vehicular.</p>
      <p v-if="analisis.mstCargando" role="status" class="analysis-note">Generando red troncal…</p>
      <p v-if="analisis.mstVisible && analisis.mst" class="analysis-note">{{ analisis.mst.esArbol ? 'Árbol mínimo' : 'Bosque mínimo' }} · {{ analisis.mst.componentes }} componentes · {{ formato.format(analisis.mst.distanciaKm) }} km</p>
      <Message v-if="analisis.errorMST" severity="error" :closable="false">{{ analisis.errorMST }} Activa la capa para reintentar.</Message>
      <label for="sectores-visibles" class="analysis-toggle"><Checkbox input-id="sectores-visibles" binary
        :model-value="analisis.sectoresVisibles" :disabled="grafo.estadoMapa !== 'listo'"
        @update:model-value="value => analisis.cambiarSectores(!!value)" />Sectores geográficos</label>
      <p class="analysis-note">Colorea las intersecciones por cuadrante. La zonificación no restringe el recorrido.</p>
      <p v-if="analisis.sectoresCargando" role="status" class="analysis-note">Cargando sectores…</p>
      <ul v-if="analisis.sectoresVisibles && analisis.sectores" class="sector-counts">
        <li v-for="sector in analisis.sectores" :key="sector.id"><span :style="{ background: coloresSectores[sector.id] }" />{{ sector.id }}: {{ formato.format(sector.nodos.length) }}</li>
      </ul>
      <Message v-if="analisis.errorSectores" severity="error" :closable="false">{{ analisis.errorSectores }} Activa la capa para reintentar.</Message>
      <Button label="Verificar UFDS" icon="pi pi-check-circle" outlined class="ufds-button"
        :loading="analisis.ufdsCargando" :disabled="grafo.estadoMapa !== 'listo' || !plan.origen || !plan.destinos.length || analisis.ufdsCargando"
        @click="analisis.verificarUFDS()" />
      <p v-if="!plan.origen || !plan.destinos.length" class="analysis-note">Selecciona punto de recojo y destinos para comprobar conectividad.</p>
      <div v-if="analisis.conectividad" role="status">
        <p class="analysis-note">UFDS comprueba conectividad débil; no garantiza un camino que respete los sentidos.</p>
        <ul class="connectivity-results"><li v-for="destino in analisis.conectividad.destinos" :key="destino.id">
          {{ destino.id }}: {{ destino.mismaComponente ? 'misma componente' : 'componente desconectada' }}
        </li></ul>
      </div>
      <Message v-if="analisis.errorUFDS" severity="error" :closable="false">{{ analisis.errorUFDS }}</Message>
    </div>
  </details>
</template>

<style>
.graph-analysis {
    margin-top: 20px;
    border-top: 1px solid #e1e6df;
    padding-top: 18px;
}

.graph-analysis > summary {
    cursor: pointer;
    font-size: .9rem;
    font-weight: 600;
}

.analysis-content {
    margin-top: 18px;
}

.analysis-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: .85rem;
    margin-top: 20px;
}

.analysis-note {
    font-size: .75rem;
    color: #526858;
    line-height: 1.6;
    margin: 10px 0;
    overflow-wrap: anywhere;
}

.ufds-button {
    margin-top: 14px;
    width: 100%;
}

.sector-counts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    list-style: none;
    padding: 0;
    gap: 8px;
    font-size: .75rem;
}

.sector-counts li > span {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}

.connectivity-results {
    padding-left: 16px;
    font-size: .75rem;
    line-height: 1.7;
    overflow-wrap: anywhere;
}
</style>
