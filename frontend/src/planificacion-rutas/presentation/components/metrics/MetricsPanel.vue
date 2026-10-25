<script setup lang="ts">
import Tag from 'primevue/tag'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import { formatearHora } from '@/shared/domain/utils/formatearHora'
import { computed } from 'vue'
import { useRutasStore } from '@/planificacion-rutas/application/stores/rutasStore'
import AlgorithmComparison from './AlgorithmComparison.vue'

const plan = usePlanificadorStore()
const rutas = useRutasStore()
const formato = (value: number | undefined, decimales = 2) => value === undefined ? '—'
  : new Intl.NumberFormat('es-PE', { maximumFractionDigits: decimales }).format(value)
const nombres = { dijkstra: 'Dijkstra', bellman_ford: 'Bellman-Ford', held_karp: 'Held-Karp', backtracking: 'Backtracking' }
const estadoTexto = computed(() => ({ inicial: 'Sin ruta calculada', cargando: 'Calculando recorrido…',
  listo: 'Ruta calculada', error: 'No se pudo calcular' })[rutas.estado])
const metricas = computed(() => [
  { nombre: 'Distancia total', unidad: 'km', icono: 'pi-map', valor: formato(rutas.resultado?.distanciaKm, 3) },
  { nombre: 'Tiempo de ejecución', unidad: 'ms', icono: 'pi-stopwatch', valor: formato(rutas.resultado?.tiempoMs, 3) },
  { nombre: 'Costo ponderado', unidad: 'm ponderados', icono: 'pi-chart-line', valor: formato(rutas.resultado?.costoPonderadoM) },
  { nombre: rutas.resultado?.unidadEvaluados === 'estados' ? 'Estados evaluados' : 'Nodos evaluados',
    unidad: rutas.resultado?.unidadEvaluados ?? 'nodos', icono: 'pi-sitemap', valor: formato(rutas.resultado?.evaluados, 0) },
])
</script>

<template>
  <aside class="metrics-panel" aria-labelledby="metrics-title">
    <div class="metrics-heading"><span class="eyebrow">RESULTADOS</span><i class="pi pi-chart-bar" aria-hidden="true" /></div>
    <h2 id="metrics-title">Tu ruta, en cifras.</h2>
    <div role="status" aria-live="polite"><Tag :value="estadoTexto" :severity="rutas.estado === 'listo' ? 'success' : rutas.estado === 'error' ? 'danger' : 'secondary'" /></div>
    <p class="metrics-description">{{ rutas.resultado ? `${nombres[rutas.resultado.algoritmo]} · Tráfico horario simulado` : rutas.estado === 'cargando' ? 'Buscando un recorrido que respete los sentidos de circulación.' : 'Selecciona tus puntos y calcula un recorrido para ver sus resultados.' }}</p>
    <dl class="route-metrics">
      <div v-for="metrica in metricas" :key="metrica.nombre" class="metric-card">
        <dt><i class="pi" :class="metrica.icono" aria-hidden="true" />{{ metrica.nombre }}</dt>
        <dd><span :class="{ 'metric-result': rutas.resultado }" :aria-label="metrica.valor === '—' ? 'Sin resultado' : undefined">{{ metrica.valor }}</span><small>{{ metrica.unidad }}</small></dd>
      </div>
    </dl>
    <AlgorithmComparison />
    <template v-if="rutas.resultado">
      <p class="metric-explanation">Tiempo del algoritmo: {{ formato(rutas.resultado.tiempoAlgoritmoMs, 3) }} ms<span v-if="rutas.resultado.tiempoMatrizMs !== null"> · Matriz vial: {{ formato(rutas.resultado.tiempoMatrizMs, 3) }} ms</span>. El tiempo de ejecución excluye la comunicación HTTP.</p>
      <section class="visit-order" aria-labelledby="visit-order-title">
        <h3 id="visit-order-title">Orden del recorrido</h3>
        <ol><li v-for="(id, index) in rutas.resultado.ordenVisita" :key="`${index}-${id}`"><span>{{ index === 0 ? 'Depósito' : index === rutas.resultado.ordenVisita.length - 1 && id === plan.origen?.id ? 'Retorno' : `Parada ${index}` }}</span><strong>{{ id }}</strong></li></ol>
      </section>
    </template>
    <section class="trip-summary" aria-labelledby="trip-summary-title">
      <h3 id="trip-summary-title" class="eyebrow">{{ rutas.resultado ? 'PARÁMETROS DEL RECORRIDO' : 'RECORRIDO EN PREPARACIÓN' }}</h3>
      <dl>
        <div><dt>Modalidad</dt><dd>{{ plan.parametros.tipoRecorrido === 'punto_a_punto' ? 'Punto a punto' : 'Multi-entrega' }}</dd></div>
        <div><dt>Hora de salida</dt><dd>{{ formatearHora(plan.parametros.minutoDia) }}</dd></div>
        <div><dt>Depósito</dt><dd>{{ plan.origen ? 'Seleccionado' : 'Por seleccionar' }}</dd></div>
        <div><dt>Destinos</dt><dd>{{ plan.destinos.length }}</dd></div>
      </dl>
    </section>
  </aside>
</template>
