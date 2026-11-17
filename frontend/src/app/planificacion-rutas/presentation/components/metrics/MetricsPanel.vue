<script setup lang="ts">
import Tag from 'primevue/tag'
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
import { formatearHora } from '@/app/shared/domain/utils/formatearHora'
import { computed } from 'vue'
import { useRutasStore } from '@/app/planificacion-rutas/application/stores/rutasStore'
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
    <h2 id="metrics-title">Tu reparto, en cifras.</h2>
    <div role="status" aria-live="polite"><Tag :value="estadoTexto" :severity="rutas.estado === 'listo' ? 'success' : rutas.estado === 'error' ? 'danger' : 'secondary'" /></div>
    <p class="metrics-description">{{ rutas.resultado ? `${nombres[rutas.resultado.algoritmo]} · Tráfico horario simulado` : rutas.estado === 'cargando' ? 'Buscando un recorrido que respete los sentidos de circulación.' : 'Elige el punto de recojo y las entregas para calcular tu ruta de reparto.' }}</p>
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
        <h3 id="visit-order-title">Orden de las entregas</h3>
        <ol><li v-for="(id, index) in rutas.resultado.ordenVisita" :key="`${index}-${id}`"><span>{{ index === 0 ? 'Punto de recojo' : index === rutas.resultado.ordenVisita.length - 1 && id === plan.origen?.id ? 'Retorno' : `Entrega ${index}` }}</span><strong>{{ id }}</strong></li></ol>
      </section>
    </template>
    <section class="trip-summary" aria-labelledby="trip-summary-title">
      <h3 id="trip-summary-title" class="eyebrow">{{ rutas.resultado ? 'DETALLE DEL REPARTO' : 'PREPARA TU REPARTO' }}</h3>
      <dl>
        <div><dt>Modalidad</dt><dd>{{ plan.parametros.tipoRecorrido === 'punto_a_punto' ? 'Un pedido' : 'Varios pedidos' }}</dd></div>
        <div><dt>Hora de salida</dt><dd>{{ formatearHora(plan.parametros.minutoDia) }}</dd></div>
        <div><dt>Punto de recojo</dt><dd>{{ plan.origen ? 'Seleccionado' : 'Por seleccionar' }}</dd></div>
        <div><dt>Puntos de entrega</dt><dd>{{ plan.destinos.length }}</dd></div>
      </dl>
    </section>
  </aside>
</template>

<style>
.metrics-panel {
    grid-area: metrics;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    padding: 24px 20px;
    border: 1px solid #e1e6df;
    border-radius: 18px;
    background: #fff;
}

.metrics-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #728a7c;
}

.metrics-panel h2 {
    margin: 22px 0 14px;
    font-size: 1.4rem;
    letter-spacing: -.045em;
}

.metrics-description {
    margin: 16px 0 20px;
    font-size: .8rem;
    line-height: 1.7;
    color: #718078;
}

.route-metrics {
    display: grid;
    gap: 12px;
    margin: 0;
}

.metric-card {
    border: 1px solid #e5eadf;
    border-radius: 12px;
    padding: 16px;
    background: #f8faf5;
}

.metric-card dt {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #718078;
    font-size: .75rem;
}

.metric-card dt i {
    color: #63886c;
}

.metric-card dd {
    margin: 14px 0 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.metric-card dd > span {
    font-size: 1.9rem;
    font-weight: 600;
    color: #91a18f;
}

.metric-card small {
    font-size: .65rem;
    color: #8a958c;
}

.trip-summary {
    margin-top: 26px;
    border-top: 1px solid #edf0e9;
    padding-top: 20px;
}

.trip-summary dl {
    display: grid;
    gap: 14px;
    margin: 20px 0 0;
}

.trip-summary dl > div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-size: .73rem;
}

.trip-summary dt {
    color: #718078;
}

.trip-summary dd {
    margin: 0;
    text-align: right;
    font-weight: 600;
}

.visit-order h3 {
    font-size: 1rem;
    margin: 0 0 16px;
    letter-spacing: -.02em;
}

.metric-card dd {
    flex-wrap: wrap;
}

.metric-card dd > .metric-result {
    color: #183c2e;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
    max-width: 100%;
}

.metric-explanation {
    font-size: .75rem;
    color: #526858;
    line-height: 1.6;
    margin: 18px 0;
}

.visit-order {
    margin-top: 24px;
}

.visit-order ol {
    padding: 0 0 0 20px;
    margin: 0;
}

.visit-order li {
    padding: 7px 0;
    font-size: .75rem;
    overflow-wrap: anywhere;
}

.visit-order li span {
    color: #526858;
    margin-right: 8px;
}

@media (max-width: 1199px) {

    .metrics-panel {
        overflow: visible;
    }

    .metrics-panel h2 {
        margin-top: 14px;
    }

    .route-metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 759px) {

    .metrics-panel {
        padding: 22px 18px;
    }
}
</style>
