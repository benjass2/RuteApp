<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Button from 'primevue/button'
import { useGrafoStore } from '@/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/planificacion-rutas/application/stores/planificadorStore'
import { useRutasStore } from '@/planificacion-rutas/application/stores/rutasStore'
import { useAnalisisStore } from '@/planificacion-rutas/application/stores/analisisStore'
import { coloresSectores } from '@/planificacion-rutas/presentation/constants/sectores'

const grafo = useGrafoStore()
const plan = usePlanificadorStore()
const rutas = useRutasStore()
const analisis = useAnalisisStore()
const container = ref<HTMLDivElement | null>(null)
let map: L.Map | undefined
let calles: L.GeoJSON | undefined
let nodos: L.LayerGroup | undefined
let seleccion: L.LayerGroup | undefined
let observer: ResizeObserver | undefined
let recorrido: L.GeoJSON | undefined
let troncal: L.GeoJSON | undefined
let rendererNodos: L.Canvas | undefined
const puntos = new Map<string, L.CircleMarker>()

function pintarMST() {
  troncal?.remove()
  troncal = undefined
  if (!map || !analisis.mstVisible || !analisis.mst) return
  troncal = L.geoJSON(analisis.mst.red, {
    pane: 'mst', style: { color: '#a75a16', weight: 3, opacity: .85, interactive: false },
  }).addTo(map)
}

function pintarSectores() {
  const colores = new Map<string, string>()
  if (analisis.sectoresVisibles) {
    for (const sector of analisis.sectores ?? []) for (const id of sector.nodos) colores.set(id, coloresSectores[sector.id])
  }
  puntos.forEach((punto, id) => {
    const color = colores.get(id)
    punto.setStyle({ color: color ?? '#436757', fillColor: color ?? '#fff', fillOpacity: color ? 1 : .9 })
  })
}

function pintarRuta() {
  recorrido?.remove()
  recorrido = undefined
  if (!map || !rutas.resultado) return
  recorrido = L.geoJSON(rutas.resultado.geometria, {
    pane: 'ruta',
    style: { color: '#126747', weight: 6, opacity: .95, interactive: false },
    pointToLayer: (_feature, latlng) => L.circleMarker(latlng, { radius: 7, color: '#126747' }),
  }).addTo(map)
  map.fitBounds(recorrido.getBounds(), { padding: [40, 40], maxZoom: 17 })
  pintarSeleccion()
}

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
    ...plan.destinos.map((nodo, index) => ({ nodo,
      label: String(rutas.resultado ? rutas.resultado.ordenVisita.indexOf(nodo.id) : index + 1), origen: false })) ]
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
  puntos.clear()
  calles = undefined
  nodos = L.layerGroup().addTo(map)
  const data = grafo.mapa
  if (!data) { seleccion?.clearLayers(); troncal?.remove(); return }
  calles = L.geoJSON(data.red, {
    style: { color: '#68877b', weight: 1.6, opacity: .8, interactive: false },
  }).addTo(map)
  for (const nodo of data.nodos) {
    const punto = L.circleMarker([nodo.lat, nodo.lon], {
      pane: 'nodos', renderer: rendererNodos,
      radius: 3, weight: .7, color: '#436757', fillColor: '#fff', fillOpacity: .9,
      bubblingMouseEvents: false,
    }).bindTooltip(() => texto(`Intersección ${nodo.id}`))
      .on('click', () => plan.seleccionarNodo(nodo)).addTo(nodos)
    puntos.set(nodo.id, punto)
  }
  centrar()
  ajustarNodos()
  pintarSeleccion()
  pintarMST()
  pintarSectores()
}

onMounted(() => {
  if (!container.value) return
  map = L.map(container.value, { preferCanvas: true, renderer: L.canvas({ tolerance: 4 }), minZoom: 11, maxZoom: 19 })
    .setView([-12.105, -77.035], 14)
  map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>')
  const paneMST = map.createPane('mst')
  paneMST.style.zIndex = '410'
  paneMST.style.pointerEvents = 'none'
  const paneNodos = map.createPane('nodos')
  paneNodos.style.zIndex = '415'
  rendererNodos = L.canvas({ pane: 'nodos', tolerance: 4 })
  const paneRuta = map.createPane('ruta')
  paneRuta.style.zIndex = '420'
  paneRuta.style.pointerEvents = 'none'
  L.control.scale({ imperial: false }).addTo(map)
  seleccion = L.layerGroup().addTo(map)
  map.on('zoomend', ajustarNodos)
  observer = new ResizeObserver(() => map?.invalidateSize())
  observer.observe(container.value)
  pintarRed()
  pintarRuta()
})
watch(() => grafo.mapa, pintarRed)
watch(() => [plan.origen, plan.destinos], pintarSeleccion)
watch(() => rutas.resultado, () => { pintarRuta(); pintarSeleccion() })
watch(() => [analisis.mst, analisis.mstVisible], pintarMST)
watch(() => [analisis.sectores, analisis.sectoresVisibles], pintarSectores)
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
      <span v-if="rutas.resultado"><b class="legend-route" /> Ruta calculada</span>
      <span v-if="analisis.mstVisible && analisis.mst"><b class="legend-mst" /> MST sin dirección</span>
      <template v-if="analisis.sectoresVisibles && analisis.sectores"><span v-for="sector in analisis.sectores" :key="sector.id"><b class="legend-dot" :style="{ background: coloresSectores[sector.id] }" />{{ sector.id }}</span></template>
    </div>
  </div>
</template>
