<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as L from 'leaflet'
import Button from 'primevue/button'
import { useGrafoStore } from '@/app/planificacion-rutas/application/stores/grafoStore'
import { usePlanificadorStore } from '@/app/planificacion-rutas/application/stores/planificadorStore'
import { useRutasStore } from '@/app/planificacion-rutas/application/stores/rutasStore'
import { useAnalisisStore } from '@/app/planificacion-rutas/application/stores/analisisStore'
import { coloresSectores } from '@/app/planificacion-rutas/presentation/components/map/sectores'

const grafo = useGrafoStore()
const plan = usePlanificadorStore()
const rutas = useRutasStore()
const analisis = useAnalisisStore()
const container = ref<HTMLDivElement | null>(null)
const fondo = ref<'osm' | 'local'>('osm')
const errorTeselas = ref(false)
const mostrarRed = ref(true)
let base: L.TileLayer | undefined
let falloCarga = false
let map: L.Map | undefined
let calles: L.GeoJSON | undefined
let nodos: L.LayerGroup | undefined
let seleccion: L.LayerGroup | undefined
let observer: ResizeObserver | undefined
let recorrido: L.GeoJSON | undefined
let troncal: L.GeoJSON | undefined
let rendererNodos: L.Canvas | undefined
const puntos = new Map<string, L.CircleMarker>()
const estiloInterseccion: L.PathOptions = {
  color: '#fff',
  fillColor: '#14515c',
  weight: 1.2,
  fillOpacity: 1,
}

function cambiarFondo() {
  if (!map || !base) return
  if (fondo.value === 'osm') base.addTo(map)
  else base.remove()
  const redVisible = fondo.value === 'local' || mostrarRed.value
  if (calles) {
    if (redVisible) calles.addTo(map)
    else calles.remove()
    calles.setStyle({ opacity: fondo.value === 'osm' ? .25 : .8 })
  }
  if (nodos) {
    if (redVisible || analisis.sectoresVisibles) nodos.addTo(map)
    else nodos.remove()
  }
}

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
    punto.setStyle({ ...estiloInterseccion, fillColor: color ?? estiloInterseccion.fillColor })
  })
  cambiarFondo()
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
  encuadrar(recorrido.getBounds(), 17)
  pintarSeleccion()
}

function texto(value: string): HTMLElement {
  const element = document.createElement('span')
  element.textContent = value
  return element
}

function encuadrar(bounds: L.LatLngBounds, maxZoom: number) {
  if (!map || !bounds.isValid()) return
  const { x: ancho, y: alto } = map.getSize()
  const compacto = ancho <= 840
  map.fitBounds(bounds, {
    paddingTopLeft: compacto ? [24, Math.min(155, alto / 3)] : [350, 115],
    paddingBottomRight: compacto ? [28, Math.min(105, alto / 4)] : [315, 42],
    maxZoom,
  })
}

function centrar() {
  const bounds = calles?.getBounds()
  if (bounds) encuadrar(bounds, 15)
}

function ajustarNodos() {
  const zoom = map?.getZoom() ?? 14
  const radio = zoom <= 14 ? 2.5 : zoom <= 15 ? 3 : 4
  nodos?.eachLayer(layer => {
    if (layer instanceof L.CircleMarker) layer.setRadius(radio)
  })
}

function pintarSeleccion() {
  if (!map || !seleccion) return
  seleccion.clearLayers()
  const puntos = [ ...(plan.origen ? [{ nodo: plan.origen, label: 'R', origen: true }] : []),
    ...plan.destinos.map((nodo, index) => ({ nodo,
      label: String(rutas.resultado ? rutas.resultado.ordenVisita.indexOf(nodo.id) : index + 1), origen: false })) ]
  for (const { nodo, label, origen } of puntos) {
    L.marker([nodo.lat, nodo.lon], {
      icon: L.divIcon({ className: `selection-marker ${origen ? 'depot-marker' : 'delivery-marker'}`,
        html: `<span>${label}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
      title: `${origen ? 'Punto de recojo' : 'Entrega ' + label}: ${nodo.id}`,
      zIndexOffset: 1000,
    }).bindTooltip(texto(`${origen ? 'Punto de recojo' : 'Entrega ' + label} · ${nodo.id}`)).addTo(seleccion)
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
      radius: 3, ...estiloInterseccion,
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
  cambiarFondo()
}

onMounted(() => {
  if (!container.value) return
  map = L.map(container.value, { preferCanvas: true, renderer: L.canvas({ tolerance: 4 }), minZoom: 11, maxZoom: 19 })
    .setView([-12.105, -77.035], 14)
  map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>')
  base = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, maxNativeZoom: 19, noWrap: true,
    updateWhenIdle: true, keepBuffer: 1,
  })
  base.on('loading', () => { falloCarga = false })
  base.on('tileerror', () => { falloCarga = true; errorTeselas.value = true })
  base.on('load', () => { errorTeselas.value = falloCarga })
  cambiarFondo()
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
watch(fondo, cambiarFondo)
watch(mostrarRed, cambiarFondo)
watch(() => [plan.origen, plan.destinos], pintarSeleccion)
watch(() => rutas.resultado, () => { pintarRuta(); pintarSeleccion() })
watch(() => [analisis.mst, analisis.mstVisible], pintarMST)
watch(() => [analisis.sectores, analisis.sectoresVisibles], pintarSectores)
onBeforeUnmount(() => { observer?.disconnect(); base?.off(); map?.remove(); map = undefined })
</script>

<template>
  <div class="map-viewer">
    <div ref="container" class="leaflet-container-root" aria-label="Mapa de la red vial. Selecciona intersecciones con el ratón o usa los selectores del panel." />
    <div v-if="grafo.estadoMapa !== 'listo'" class="map-overlay" :class="{ 'map-overlay-compact': fondo === 'osm' }" role="status">
      <i class="pi" :class="grafo.estadoMapa === 'cargando' ? 'pi-spin pi-spinner' : 'pi-map'" aria-hidden="true" />
      <h2>{{ grafo.estadoMapa === 'cargando' ? 'Cargando red vial…' : 'La ciudad, punto a punto' }}</h2>
      <p v-if="grafo.estadoMapa === 'error'">{{ grafo.errorMapa }}</p>
      <p v-else-if="grafo.estado === 'error'">Comprueba FastAPI y reintenta desde Red vial.</p>
      <p v-else-if="grafo.estado === 'sin_dataset'">El backend necesita cargar el dataset local para mostrar las calles.</p>
      <p v-else>Preparando las calles e intersecciones de Miraflores y San Isidro.</p>
      <Button v-if="grafo.estadoMapa === 'error'" label="Reintentar mapa" icon="pi pi-refresh" @click="grafo.cargarRed()" />
    </div>
    <div class="map-tools">
      <div class="basemap-options" role="group" aria-label="Mapa base">
        <Button label="Mapa OSM" size="small" :severity="fondo === 'osm' ? 'primary' : 'secondary'" :aria-pressed="fondo === 'osm'" @click="fondo = 'osm'" />
        <Button label="Solo grafo" size="small" :severity="fondo === 'local' ? 'primary' : 'secondary'" :aria-pressed="fondo === 'local'" @click="fondo = 'local'" />
        <Button icon="pi pi-expand" label="Centrar red" size="small" severity="secondary" :disabled="grafo.estadoMapa !== 'listo'" @click="centrar" />
        <label v-if="fondo === 'osm' && grafo.estadoMapa === 'listo'" class="map-hint"><input v-model="mostrarRed" type="checkbox"> Intersecciones</label>
      </div>
    </div>
    <div v-if="fondo === 'osm' && errorTeselas" class="basemap-error" role="status">
      <p>No se pudieron cargar algunas imágenes de OpenStreetMap. Comprueba tu conexión o utiliza Solo grafo.</p>
      <Button label="Reintentar imágenes" size="small" severity="secondary" @click="base?.redraw()" />
    </div>
    <div v-if="grafo.estadoMapa === 'listo'" class="map-legend" aria-label="Leyenda del mapa">
      <span><b class="legend-dot depot" /> Punto de recojo</span><span><b class="legend-dot delivery" /> Entregas</span><span v-if="fondo === 'local' || mostrarRed"><b class="legend-dot junction" /> Intersecciones</span>
      <span v-if="rutas.resultado"><b class="legend-route" /> Ruta calculada</span>
      <span v-if="analisis.mstVisible && analisis.mst"><b class="legend-mst" /> MST sin dirección</span>
      <template v-if="analisis.sectoresVisibles && analisis.sectores"><span v-for="sector in analisis.sectores" :key="sector.id"><b class="legend-dot" :style="{ background: coloresSectores[sector.id] }" />{{ sector.id }}</span></template>
    </div>
  </div>
</template>

<style>
@import "leaflet/dist/leaflet.css";

.map-viewer {
    position: relative;
    flex: 1;
    min-height: 430px;
    border-radius: 12px;
    border: 1px solid #d2ddcc;
    overflow: hidden;
}

.map-viewer .leaflet-container-root {
    height: 100%;
    width: 100%;
    min-height: 430px;
    background: #eaf0e5;
}

.map-overlay {
    position: absolute;
    inset: 0;
    z-index: 1100;
    background: #edf3e6ed;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 25px;
}

.map-overlay > i {
    font-size: 2rem;
    color: #5b795b;
    margin-bottom: 20px;
}

.map-overlay h2 {
    font-size: 1.35rem;
    letter-spacing: -.03em;
}

.map-overlay p {
    color: #64765d;
    line-height: 1.7;
    font-size: .85rem;
    max-width: 350px;
}

.map-tools {
    position: absolute;
    top: 12px;
    right: 12px;
    left: 55px;
    z-index: 800;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    pointer-events: none;
}

.map-tools > * {
    pointer-events: auto;
}

.map-hint {
    font-size: .73rem;
    padding: 10px;
    border-radius: 7px;
    background: #ffffffed;
    color: #365743;
}

.map-legend {
    position: absolute;
    bottom: 32px;
    right: 10px;
    z-index: 800;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 10px;
    border-radius: 7px;
    background: #ffffffed;
    font-size: .65rem;
    color: #42604c;
}

.legend-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 3px;
}

.depot {
    background: #173c30;
}

.delivery {
    background: #d58633;
}

.junction {
    background: #14515c;
}

.map-viewer .selection-marker {
    border: 2px solid white;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: white;
    font-weight: 700;
    box-shadow: 0 2px 6px #163c3040;
}

.depot-marker {
    background: #173c30;
}

.delivery-marker {
    background: #b46b22;
}

@media (max-width: 640px) {

    .map-tools {
        left: 48px;
    }

    .map-hint {
        font-size: .65rem;
    }
}
.basemap-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
}

.map-overlay.map-overlay-compact {
    inset: auto 12px 64px;
    max-width: 350px;
    padding: 16px;
    border-radius: 12px;
    background: #fff;
}

.map-overlay.map-overlay-compact > i {
    display: none;
}

.basemap-error {
    position: absolute;
    top: 110px;
    right: 12px;
    left: 55px;
    z-index: 850;
    background: #fff;
    padding: 12px;
    border-radius: 12px;
    color: #654713;
    font-size: .8rem;
}

.basemap-error p {
    margin: 0 0 8px;
    line-height: 1.5;
}

.map-viewer {
    min-height: 0;
}

.map-viewer .leaflet-container-root {
    min-height: 0;
}

.legend-mst {
    display: inline-block;
    width: 12px;
    height: 3px;
    background: #a75a16;
    vertical-align: middle;
}

.legend-route {
    display: inline-block;
    width: 12px;
    height: 3px;
    background: #126747;
    vertical-align: middle;
}
.route-workspace .map-viewer {
  position: absolute;
  inset: 0;
  min-height: 0;
  border: 0;
  border-radius: 0;
}
.route-workspace .leaflet-container-root { min-height: 0; }
.route-workspace .leaflet-top.leaflet-left { top: auto; bottom: 31px; }
.route-workspace .map-tools { top: var(--hud-gap); right: var(--hud-gap); }
.route-workspace .basemap-options {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 5px;
  background: rgba(255,255,255,.96);
  border: 1px solid rgba(0,0,0,.08);
  border-radius: 999px;
  box-shadow: 0 6px 22px rgba(24,52,44,.14);
}
.basemap-options .p-button { border-radius: 999px; }
.route-workspace .map-hint { background: transparent; padding: 4px 8px; color: #314a40; }
.map-hint input { accent-color: #087452; vertical-align: middle; }
.route-workspace .map-overlay, .route-workspace .basemap-error {
  inset: auto auto 56px 50%;
  width: min(320px, calc(100% - 32px));
  transform: translateX(-50%);
  border-radius: 14px;
  background: rgba(255,255,255,.96);
  box-shadow: 0 6px 22px rgba(24,52,44,.14);
}
.route-workspace .basemap-error { bottom: 245px; }
@media (max-width: 840px) {
  .route-workspace .map-tools { top: var(--hud-top); left: var(--hud-gap); justify-content: center; }
  .route-workspace .basemap-options .p-button { padding: 5px 7px; min-height: 34px; font-size: .7rem; }
  .route-workspace .map-hint { padding: 3px; font-size: .69rem; white-space: nowrap; }
  .route-workspace .leaflet-top.leaflet-left { bottom: 97px; }
  .route-workspace .map-overlay { bottom: 105px; }
  .route-workspace .map-legend, .route-workspace .leaflet-control-scale { display: none; }
}
.map-viewer .leaflet-container-root {
  cursor: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2030%2030%22%3E%3Cpath%20d%3D%22M5%203%20L5%2023%20L10%2018%20L15%2026%20L19%2024%20L14%2016%20L22%2016%20Z%22%20fill%3D%22%2310382d%22%20stroke%3D%22white%22%20stroke-width%3D%222.4%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E") 5 3, grab;
}

.map-viewer .leaflet-container-root .leaflet-interactive {
  cursor: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2030%2030%22%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%228%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%226%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%228%22%20fill%3D%22none%22%20stroke%3D%22%2310382d%22%20stroke-width%3D%222.5%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%222.3%22%20fill%3D%22%2310382d%22%20stroke%3D%22white%22%2F%3E%3C%2Fsvg%3E") 15 15, pointer;
}

.leaflet-dragging .map-viewer .leaflet-container-root,
.leaflet-dragging .map-viewer .leaflet-container-root .leaflet-interactive {
  cursor: grabbing;
}

</style>
