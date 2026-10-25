<script setup lang="ts">
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import { useGrafoStore } from '@/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import { useRutasStore } from '@/planificacion-rutas/application/stores/rutasStore'
import { computed } from 'vue'

const grafo = useGrafoStore()
const plan = usePlanificadorStore()
const rutas = useRutasStore()
const destinosMostrados = computed(() => rutas.resultado
  ? rutas.resultado.ordenVisita.filter(id => id !== plan.origen?.id)
    .flatMap(id => { const nodo = plan.destinos.find(n => n.id === id); return nodo ? [nodo] : [] })
  : plan.destinos)

function seleccionar(id: string | null, tipo: 'origen' | 'destino') {
  const nodo = grafo.mapa?.nodos.find(n => n.id === id)
  if (!nodo) return
  plan.seleccionActiva = tipo
  plan.seleccionarNodo(nodo)
}
</script>

<template>
  <section class="route-parameters" aria-labelledby="route-parameters-title">
    <h3 id="route-parameters-title" class="eyebrow">RECOJO Y ENTREGAS</h3>
    <p class="graph-description">Marca dónde se recoge el pedido y dónde se entrega. Usa las intersecciones del mapa o busca su ID de OpenStreetMap.</p>
    <div class="selection-options" role="group" aria-label="Próximo punto a seleccionar en el mapa">
      <Button label="Recojo" icon="pi pi-home" size="small" :outlined="plan.seleccionActiva !== 'origen'"
        :aria-pressed="plan.seleccionActiva === 'origen'" @click="plan.seleccionActiva = 'origen'" />
      <Button label="Entrega" icon="pi pi-flag" size="small" :outlined="plan.seleccionActiva !== 'destino'"
        :aria-pressed="plan.seleccionActiva === 'destino'" @click="plan.seleccionActiva = 'destino'" />
    </div>
    <label for="origen">Punto de recojo</label>
    <Select input-id="origen" aria-label="Punto de recojo" :model-value="plan.origen?.id ?? null" :options="grafo.mapa?.nodos ?? []"
      option-label="id" option-value="id" filter :virtual-scroller-options="{ itemSize: 38 }"
      placeholder="Seleccionar intersección" :disabled="grafo.estadoMapa !== 'listo'"
      @update:model-value="id => seleccionar(id, 'origen')" />
    <label for="destino">{{ plan.parametros.tipoRecorrido === 'multi_entrega' ? 'Agregar entrega' : 'Punto de entrega' }}</label>
    <Select :key="`${plan.parametros.tipoRecorrido}-${plan.destinos.length}`" input-id="destino" aria-label="Seleccionar punto de entrega" :model-value="plan.parametros.tipoRecorrido === 'punto_a_punto' ? plan.destinos[0]?.id ?? null : null"
      :options="grafo.mapa?.nodos ?? []" option-label="id" option-value="id" filter
      :virtual-scroller-options="{ itemSize: 38 }" placeholder="Seleccionar intersección"
      :disabled="grafo.estadoMapa !== 'listo'" @update:model-value="id => seleccionar(id, 'destino')" />
    <ol class="stop-list" aria-label="Puntos de entrega seleccionados">
      <li v-for="(nodo, index) in destinosMostrados" :key="nodo.id"><span>{{ index + 1 }}. {{ nodo.id }}</span>
        <Button icon="pi pi-times" text rounded severity="secondary" size="small"
          :aria-label="`Quitar entrega ${nodo.id}`" @click="plan.quitarDestino(nodo.id)" />
      </li>
    </ol>
    <Message v-if="plan.errorSeleccion" severity="warn" :closable="false">{{ plan.errorSeleccion }}</Message>
    <Button label="Limpiar selección" icon="pi pi-trash" text size="small" severity="secondary"
      :disabled="!plan.origen && plan.destinos.length === 0" @click="plan.limpiar()" />
    <p class="graph-description">{{ plan.parametros.tipoRecorrido === 'multi_entrega' ? `${plan.destinos.length}/12 entregas seleccionadas. ${rutas.resultado ? 'Orden de visitas optimizado.' : 'El orden se optimizará al calcular.'}` : 'Un punto de recojo y una entrega por pedido.' }}</p>
  </section>
</template>
