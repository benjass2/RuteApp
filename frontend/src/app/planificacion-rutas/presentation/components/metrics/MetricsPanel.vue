<script setup lang="ts">
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
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
  { nombre: 'Tiempo de ejecución', unidad: 'ms', icono: 'pi-stopwatch', valor: formato(rutas.resultado?.tiempoMs, 3) },
  { nombre: 'Costo ponderado', unidad: 'm ponderados', icono: 'pi-chart-line', valor: formato(rutas.resultado?.costoPonderadoM) },
  { nombre: rutas.resultado?.unidadEvaluados === 'estados' ? 'Estados evaluados' : 'Nodos evaluados',
    unidad: rutas.resultado?.unidadEvaluados ?? 'nodos', icono: 'pi-sitemap', valor: formato(rutas.resultado?.evaluados, 0) },
])
</script>

<template>
  <aside class="metrics-panel hud-surface" aria-labelledby="metrics-title" :class="{ 'metrics-ready': rutas.resultado }">
    <h2 id="metrics-title">Resultado del reparto</h2>
    <p class="metrics-status" role="status">{{ rutas.resultado ? estadoTexto : rutas.estado === 'inicial' ? 'Elige el recojo y las entregas para calcular una ruta.' : estadoTexto }}</p>
    <Transition name="metrics-reveal">
      <div v-if="rutas.resultado">
        <div class="distance-total"><span>Distancia total</span><strong>{{ formato(rutas.resultado.distanciaKm, 3) }} <small>km</small></strong></div>
        <section class="visit-order" aria-labelledby="visit-order-title">
          <h3 id="visit-order-title">Orden de las entregas</h3>
          <ol><li v-for="(id, index) in rutas.resultado.ordenVisita" :key="`${index}-${id}`"><span>{{ index === 0 ? 'Punto de recojo' : index === rutas.resultado.ordenVisita.length - 1 && id === plan.origen?.id ? 'Retorno' : `Entrega ${index}` }}</span><strong>{{ id }}</strong></li></ol>
        </section>
        <details class="metrics-details">
          <summary>Métricas del algoritmo</summary>
          <p class="metric-explanation">{{ nombres[rutas.resultado.algoritmo] }} · Tráfico simulado</p>
          <dl class="route-metrics">
            <div v-for="metrica in metricas" :key="metrica.nombre" class="metric-card">
              <dt><i class="pi" :class="metrica.icono" aria-hidden="true" />{{ metrica.nombre }}</dt>
              <dd><span :class="{ 'metric-result': rutas.resultado }" :aria-label="metrica.valor === '—' ? 'Sin resultado' : undefined">{{ metrica.valor }}</span><small>{{ metrica.unidad }}</small></dd>
            </div>
          </dl>
          <p class="metric-explanation">Tiempo del algoritmo: {{ formato(rutas.resultado.tiempoAlgoritmoMs, 3) }} ms<span v-if="rutas.resultado.tiempoMatrizMs !== null"> · Matriz vial: {{ formato(rutas.resultado.tiempoMatrizMs, 3) }} ms</span>. El tiempo de ejecución excluye la comunicación HTTP.</p>
        </details>
        <AlgorithmComparison />
      </div>
    </Transition>
  </aside>
</template>

<style>
.metrics-panel.hud-surface {
  position: absolute;
  z-index: 1150;
  top: var(--hud-top);
  right: var(--hud-gap);
  width: var(--result-width);
  padding: 15px 17px;
  max-height: calc(100% - var(--hud-top) - 44px);
  overflow: auto;
  background: rgba(255,255,255,.94);
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 16px;
}
.metrics-panel.hud-surface h2 { margin: 0 0 6px; font-size: .95rem; }
.metrics-status { margin: 0; color: #40584f; font-size: .78rem; line-height: 1.45; }
.distance-total { display: grid; gap: 4px; margin: 18px 0; color: #345348; font-size: .8rem; }
.distance-total strong { font-size: 2rem; color: #07553e; font-variant-numeric: tabular-nums; }
.distance-total small { font-size: .9rem; }
.metrics-details { margin-top: 14px; }
.metrics-details summary { cursor: pointer; font-size: .8rem; font-weight: 650; }
.metrics-reveal-enter-active { transition: opacity 220ms ease-out, transform 220ms ease-out; }
.metrics-reveal-enter-from { opacity: 0; transform: translateY(6px); }
@media (max-width: 840px) {
  .metrics-panel.hud-surface { top: auto; bottom: 105px; width: min(280px, calc(100% - 68px)); max-height: 34dvh; }
  .metrics-panel:not(.metrics-ready) { display: none; }
  .route-workspace:has(.planner-expanded) .metrics-panel { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .metrics-reveal-enter-active { transition: none; }
}

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
