<script setup lang="ts">
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useAnalisisStore } from '@/planificacion-rutas/application/stores/analisisStore'
import { useGrafoStore } from '@/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import { coloresSectores } from '@/planificacion-rutas/presentation/constants/sectores'

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
      <p v-if="!plan.origen || !plan.destinos.length" class="analysis-note">Selecciona depósito y destinos para comprobar conectividad.</p>
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
