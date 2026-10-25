<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Button from 'primevue/button'
import { useGrafoStore } from '@/application/stores/grafoStore'
import { usePlanificadorStore } from '@/application/stores/planificadorStore'

const grafo = useGrafoStore()
const plan = usePlanificadorStore()
const container = ref<HTMLDivElement | null>(null)
let map: L.Map | undefined
let calles: L.GeoJSON | undefined
let nodos: L.LayerGroup | undefined
let seleccion: L.LayerGroup | undefined
let observer: ResizeObserver | undefined

function texto(value: string): HTMLElement {
  const element = document.createElement('span')
  element.textContent = value
  return element
}

function centrar() {
  const bounds = calles?.getBounds()
  if (bounds?.isValid()) map?.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 })
}

function ajustarNodos() {
  const zoom = map?.getZoom() ?? 14
  const radio = zoom <= 14 ? 1.4 : zoom <= 15 ? 2.2 : 3.5
  nodos?.eachLayer(layer => {
    if (layer instanceof L.CircleMarker) layer.setRadius(radio)
  })
}

function pintarSeleccion() {
  if (!map || !seleccion) return
  seleccion.clearLayers()
  const puntos = [ ...(plan.origen ? [{ nodo: plan.origen, label: 'D', origen: true }] : []),
    ...plan.destinos.map((nodo, index) => ({ nodo, label: String(index + 1), origen: false })) ]
  for (const { nodo, label, origen } of puntos) {
    L.marker([nodo.lat, nodo.lon], {
      icon: L.divIcon({ className: `selection-marker ${origen ? 'depot-marker' : 'delivery-marker'}`,
        html: `<span>${label}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
      title: `${origen ? 'Depósito' : 'Entrega ' + label}: ${nodo.id}`,
      zIndexOffset: 1000,
    }).bindTooltip(texto(`${origen ? 'Depósito' : 'Entrega ' + label} · ${nodo.id}`)).addTo(seleccion)
  }
}

function pintarRed() {
  if (!map) return
  calles?.remove()
  nodos?.remove()
  calles = undefined
  nodos = L.layerGroup().addTo(map)
  const data = grafo.mapa
  if (!data) { seleccion?.clearLayers(); return }
  calles = L.geoJSON(data.red, {
    style: { color: '#68877b', weight: 1.6, opacity: .8, interactive: false },
  }).addTo(map)
  for (const nodo of data.nodos) {
    L.circleMarker([nodo.lat, nodo.lon], {
      radius: 3, weight: .7, color: '#436757', fillColor: '#fff', fillOpacity: .9,
      bubblingMouseEvents: false,
    }).bindTooltip(() => texto(`Intersección ${nodo.id}`))
      .on('click', () => plan.seleccionarNodo(nodo)).addTo(nodos)
  }
  centrar()
  ajustarNodos()
  pintarSeleccion()
}

onMounted(() => {
  if (!container.value) return
  map = L.map(container.value, { preferCanvas: true, renderer: L.canvas({ tolerance: 4 }), minZoom: 11, maxZoom: 19 })
    .setView([-12.105, -77.035], 14)
  map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>')
  L.control.scale({ imperial: false }).addTo(map)
  seleccion = L.layerGroup().addTo(map)
  map.on('zoomend', ajustarNodos)
  observer = new ResizeObserver(() => map?.invalidateSize())
  observer.observe(container.value)
  pintarRed()
})
watch(() => grafo.mapa, pintarRed)
watch(() => [plan.origen, plan.destinos], pintarSeleccion)
onBeforeUnmount(() => { observer?.disconnect(); map?.remove(); map = undefined })
</script>

<template>
  <div class="map-viewer">
    <div ref="container" class="leaflet-container-root" aria-label="Mapa de la red vial. Selecciona intersecciones con el ratón o usa los selectores del panel." />
    <div v-if="grafo.estadoMapa !== 'listo'" class="map-overlay" role="status">
      <i class="pi" :class="grafo.estadoMapa === 'cargando' ? 'pi-spin pi-spinner' : 'pi-map'" aria-hidden="true" />
      <h2>{{ grafo.estadoMapa === 'cargando' ? 'Cargando red vial…' : 'La ciudad, punto a punto' }}</h2>
      <p v-if="grafo.estadoMapa === 'error'">{{ grafo.errorMapa }}</p>
      <p v-else-if="grafo.estado === 'error'">Conecta FastAPI y pulsa Reintentar conexión en el panel.</p>
      <p v-else-if="grafo.estado === 'sin_dataset'">El backend necesita cargar el dataset local para mostrar las calles.</p>
      <p v-else>Preparando las calles e intersecciones de Miraflores y San Isidro.</p>
      <Button v-if="grafo.estadoMapa === 'error'" label="Reintentar mapa" icon="pi pi-refresh" @click="grafo.cargarRed()" />
    </div>
    <div v-if="grafo.estadoMapa === 'listo'" class="map-tools">
      <span class="map-hint">Selecciona {{ plan.seleccionActiva === 'origen' ? 'el depósito' : 'un destino' }} en una intersección</span>
      <Button icon="pi pi-expand" label="Centrar red" size="small" severity="secondary" @click="centrar" />
    </div>
    <div v-if="grafo.estadoMapa === 'listo'" class="map-legend" aria-label="Leyenda del mapa">
      <span><b class="legend-dot depot" /> Depósito</span><span><b class="legend-dot delivery" /> Entregas</span><span><b class="legend-dot junction" /> Intersecciones</span>
    </div>
  </div>
</template>
