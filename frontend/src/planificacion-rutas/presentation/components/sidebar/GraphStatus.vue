<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import { useGrafoStore } from '@/planificacion-rutas/application/stores/grafoStore'

const grafo = useGrafoStore()
const formato = new Intl.NumberFormat('es-PE')
</script>

<template>
  <section class="graph-status" aria-labelledby="graph-status-title" :aria-busy="grafo.estado === 'cargando'">
    <div class="section-heading"><h3 id="graph-status-title" class="eyebrow">ESTADO DEL GRAFO</h3>
      <Tag v-if="grafo.estado === 'listo'" value="Conectado" severity="success" />
    </div>
    <div aria-live="polite">
      <template v-if="grafo.estado === 'cargando'">
        <p class="graph-description">Consultando el dataset…</p>
        <Skeleton height="4rem" aria-hidden="true" />
      </template>
      <template v-else-if="grafo.resumen && grafo.estado === 'listo'">
        <dl class="graph-counts">
          <div><dt>Intersecciones</dt><dd>{{ formato.format(grafo.resumen.cantidadNodos) }}</dd></div>
          <div><dt>Arcos viales</dt><dd>{{ formato.format(grafo.resumen.cantidadAristas) }}</dd></div>
        </dl>
        <p class="graph-description">{{ grafo.resumen.fuente }} · Grafo {{ grafo.resumen.dirigido ? 'dirigido' : 'no dirigido' }}</p>
        <small class="graph-attribution">{{ grafo.resumen.atribucion }}</small>
      </template>
      <Message v-else-if="grafo.estado === 'sin_dataset'" severity="warn" :closable="false">
        FastAPI está disponible, pero el dataset no está cargado. Revisa los datos del backend y reinícialo.
      </Message>
      <Message v-else-if="grafo.estado === 'error'" severity="error" :closable="false">{{ grafo.mensajeError }}</Message>
      <p v-else class="graph-description">La conexión aún no se ha verificado.</p>
    </div>
    <Button :label="grafo.estado === 'listo' ? 'Actualizar estado' : 'Reintentar conexión'"
      icon="pi pi-refresh" severity="secondary" text size="small" :loading="grafo.estado === 'cargando'"
      :disabled="grafo.estado === 'cargando'" @click="grafo.cargar()" />
  </section>
</template>
