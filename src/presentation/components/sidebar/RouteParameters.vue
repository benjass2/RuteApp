<script setup lang="ts">
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import { useGrafoStore } from '@/application/stores/grafoStore'
import { usePlanificadorStore } from '@/application/stores/planificadorStore'

const grafo = useGrafoStore()
const plan = usePlanificadorStore()

function seleccionar(id: string | null, tipo: 'origen' | 'destino') {
  const nodo = grafo.mapa?.nodos.find(n => n.id === id)
  if (!nodo) return
  plan.seleccionActiva = tipo
  plan.seleccionarNodo(nodo)
}
</script>

<template>
  <section class="route-parameters" aria-labelledby="route-parameters-title">
    <h3 id="route-parameters-title" class="eyebrow">DEPÓSITO Y ENTREGAS</h3>
    <p class="graph-description">Selecciona intersecciones en el mapa o búscalas por su ID de OpenStreetMap.</p>
    <div class="selection-options" role="group" aria-label="Próximo punto a seleccionar en el mapa">
      <Button label="Depósito" icon="pi pi-home" size="small" :outlined="plan.seleccionActiva !== 'origen'"
        :aria-pressed="plan.seleccionActiva === 'origen'" @click="plan.seleccionActiva = 'origen'" />
      <Button label="Destino" icon="pi pi-flag" size="small" :outlined="plan.seleccionActiva !== 'destino'"
        :aria-pressed="plan.seleccionActiva === 'destino'" @click="plan.seleccionActiva = 'destino'" />
    </div>
    <label for="origen">Depósito</label>
    <Select input-id="origen" aria-label="Depósito" :model-value="plan.origen?.id ?? null" :options="grafo.mapa?.nodos ?? []"
      option-label="id" option-value="id" filter :virtual-scroller-options="{ itemSize: 38 }"
      placeholder="Seleccionar intersección" :disabled="grafo.estadoMapa !== 'listo'"
      @update:model-value="id => seleccionar(id, 'origen')" />
    <label for="destino">{{ plan.parametros.tipoRecorrido === 'multi_entrega' ? 'Agregar entrega' : 'Destino' }}</label>
    <Select input-id="destino" aria-label="Seleccionar destino" :model-value="plan.parametros.tipoRecorrido === 'punto_a_punto' ? plan.destinos[0]?.id ?? null : null"
      :options="grafo.mapa?.nodos ?? []" option-label="id" option-value="id" filter
      :virtual-scroller-options="{ itemSize: 38 }" placeholder="Seleccionar intersección"
      :disabled="grafo.estadoMapa !== 'listo'" @update:model-value="id => seleccionar(id, 'destino')" />
    <ol class="stop-list" aria-label="Destinos seleccionados">
      <li v-for="(nodo, index) in plan.destinos" :key="nodo.id"><span>{{ index + 1 }}. {{ nodo.id }}</span>
        <Button icon="pi pi-times" text rounded severity="secondary" size="small"
          :aria-label="`Quitar destino ${nodo.id}`" @click="plan.quitarDestino(nodo.id)" />
      </li>
    </ol>
    <Message v-if="plan.errorSeleccion" severity="warn" :closable="false">{{ plan.errorSeleccion }}</Message>
    <Button label="Limpiar selección" icon="pi pi-trash" text size="small" severity="secondary"
      :disabled="!plan.origen && plan.destinos.length === 0" @click="plan.limpiar()" />
    <p class="graph-description">{{ plan.parametros.tipoRecorrido === 'multi_entrega' ? `${plan.destinos.length}/12 entregas seleccionadas. El orden se optimizará al calcular.` : 'Un depósito y un destino por recorrido.' }}</p>
  </section>
</template>
