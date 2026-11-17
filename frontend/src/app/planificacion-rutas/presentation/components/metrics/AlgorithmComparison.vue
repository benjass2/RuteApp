<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useRutasStore } from '@/app/planificacion-rutas/application/stores/rutasStore'

const rutas = useRutasStore()
const nombres = { dijkstra: 'Dijkstra', bellman_ford: 'Bellman-Ford', held_karp: 'Held-Karp', backtracking: 'Backtracking' }
const formato = (n: number) => new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(n)
</script>

<template>
  <section v-if="rutas.comparacion" class="algorithm-comparison" aria-labelledby="comparison-title">
    <h3 id="comparison-title">Comparación de algoritmos</h3>
    <p class="analysis-note">Selecciona un algoritmo de la tabla para ver su ruta.</p>
    <div class="comparison-scroll"><table>
      <caption class="sr-only">Tiempo exclusivo del algoritmo y costo ponderado, con los mismos parámetros</caption>
      <thead><tr><th scope="col">Algoritmo</th><th scope="col">ms</th><th scope="col">Costo (m)</th></tr></thead>
      <tbody><tr v-for="resultado in rutas.comparacion.resultados" :key="resultado.algoritmo"
        :class="{ 'visible-comparison': rutas.resultado?.algoritmo === resultado.algoritmo }">
        <th scope="row"><Button :label="nombres[resultado.algoritmo]" text size="small"
          :aria-label="`Ver ruta ${nombres[resultado.algoritmo]}`" :aria-pressed="rutas.resultado?.algoritmo === resultado.algoritmo"
          @click="rutas.mostrarResultado(resultado.algoritmo)" /></th>
        <td>{{ formato(resultado.tiempoAlgoritmoMs) }}</td><td>{{ formato(resultado.costoPonderadoM) }}</td>
      </tr></tbody>
    </table></div>
    <Message :severity="rutas.comparacion.costosEquivalentes ? 'success' : 'warn'" :closable="false">
      {{ rutas.comparacion.costosEquivalentes ? 'Ambos motores obtuvieron costos óptimos equivalentes.' : 'Los costos difieren. Revisa los resultados antes de concluir.' }}
    </Message>
    <p class="analysis-note">Una ejecución por motor, con tolerancia numérica. Los tiempos son muestras individuales, no un benchmark estadístico. En TSP excluyen la matriz vial compartida.</p>
  </section>
</template>

<style>
.analysis-note {
    font-size: .75rem;
    color: #526858;
    line-height: 1.6;
    margin: 10px 0;
    overflow-wrap: anywhere;
}

.algorithm-comparison {
    position: relative;
    margin: 24px 0;
    padding-top: 20px;
    border-top: 1px solid #e1e6df;
}

.algorithm-comparison h3 {
    font-size: 1rem;
    margin: 0 0 12px;
}

.comparison-scroll {
    max-width: 100%;
    overflow-x: auto;
    margin-bottom: 14px;
}

.comparison-scroll table {
    width: 100%;
    border-collapse: collapse;
    font-size: .7rem;
    font-variant-numeric: tabular-nums;
}

.comparison-scroll th, .comparison-scroll td {
    padding: 10px 4px;
    text-align: right;
    border-bottom: 1px solid #e1e6df;
}

.comparison-scroll th:first-child {
    text-align: left;
}

.comparison-scroll .p-button {
    padding: 6px 0;
    font-size: .72rem;
    text-align: left;
}

.visible-comparison {
    background: #edf5e8;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
}
</style>
