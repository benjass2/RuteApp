<script setup lang="ts">
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useRutasStore } from '@/application/stores/rutasStore'

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
