import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

// Vite carga TypeScript y los aliases reales; no requiere otro runner.
let server, HttpClient, HttpError, leerEstado, leerResumen, cargarEstadoGrafo
const originalFetch = globalThis.fetch
before(async () => {
  server = await createServer({ configFile: false, appType: 'custom',
    server: { middlewareMode: true },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  })
  ;({ HttpClient, HttpError } = await server.ssrLoadModule('/src/infrastructure/http/httpClient.ts'))
  ;({ leerEstado, leerResumen } = await server.ssrLoadModule('/src/infrastructure/api/dtos.ts'))
  ;({ cargarEstadoGrafo } = await server.ssrLoadModule('/src/application/use-cases/cargarGrafo.ts'))
})
after(async () => { globalThis.fetch = originalFetch; await server?.close() })

test('HTTP JSON, errores FastAPI y respuestas HTML', async () => {
  const client = new HttpClient()
  globalThis.fetch = async (url) => {
    assert.equal(url, '/api/health')
    return Response.json({ status: 'ok', dataset_disponible: true })
  }
  assert.equal((await client.get('/health')).dataset_disponible, true)
  globalThis.fetch = async () => Response.json({ detail: [{ msg: 'Campo requerido' }] }, { status: 422 })
  await assert.rejects(client.get('/health'), error => error instanceof HttpError && error.status === 422 && error.message === 'Campo requerido')
  globalThis.fetch = async () => new Response('<html>Error del proxy</html>', { status: 502 })
  await assert.rejects(client.get('/health'), error => error.status === 502 && !error.message.includes('<html>'))
  globalThis.fetch = async () => new Response('<html>SPA</html>')
  await assert.rejects(client.get('/health'), /no es JSON/)
})

test('fallo de red, timeout y cancelación explícita', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
  await assert.rejects(new HttpClient().get('/health'), /FastAPI/)
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })
  await assert.rejects(new HttpClient('/api', 10).get('/health'), /tardó demasiado/)
  const controller = new AbortController()
  const request = new HttpClient().get('/health', controller.signal)
  controller.abort()
  await assert.rejects(request, error => error.name === 'AbortError')
})

test('validación de contratos y dataset no disponible', async () => {
  for (const value of [null, [], {}, { status: 'ok', dataset_disponible: 'true' }]) {
    assert.throws(() => leerEstado(value))
  }
  const valid = { nodos: 2726, aristas: 5387, dirigido: true, fuente: 'OSM', atribucion: 'OSM contributors' }
  assert.equal(leerResumen(valid).nodos, 2726)
  for (const value of [-1, NaN, 1.5, '2726']) assert.throws(() => leerResumen({ ...valid, nodos: value }))
  let reads = 0
  const result = await cargarEstadoGrafo({ consultarEstado: async () => ({ datasetDisponible: false }),
    obtenerResumen: async () => { reads++; return valid } })
  assert.equal(result.tipo, 'sin_dataset')
  assert.equal(reads, 0)
})

test('el repositorio adapta snake_case al dominio', async () => {
  const { HttpRuteaRepository } = await server.ssrLoadModule('/src/infrastructure/api/HttpRuteaRepository.ts')
  const repo = new HttpRuteaRepository({ get: async path => path === '/health'
    ? { status: 'ok', dataset_disponible: true }
    : { nodos: 2726, aristas: 5387, dirigido: true, fuente: 'OSM', atribucion: 'OSM contributors' } })
  const result = await cargarEstadoGrafo(repo)
  assert.equal(result.tipo, 'listo')
  assert.equal(result.resumen.cantidadNodos, 2726)
  assert.equal(result.resumen.cantidadAristas, 5387)
})

test('el store ignora una solicitud anterior al reintento', async () => {
  const { createApp } = await import('vue')
  const { createPinia } = await import('pinia')
  const { ruteaRepositoryKey } = await server.ssrLoadModule('/src/application/ports/dependencies.ts')
  const { useGrafoStore } = await server.ssrLoadModule('/src/application/stores/grafoStore.ts')
  let completarPrimera
  let consultas = 0
  const repository = {
    consultarEstado: () => ++consultas === 1 ? new Promise(resolve => { completarPrimera = resolve })
      : Promise.resolve({ datasetDisponible: false }),
    obtenerResumen: async () => ({ cantidadNodos: 1, cantidadAristas: 1, dirigido: true, fuente: 'OSM', atribucion: 'OSM' }),
  }
  const pinia = createPinia()
  const app = createApp({}).use(pinia).provide(ruteaRepositoryKey, repository)
  const store = app.runWithContext(() => useGrafoStore(pinia))
  const primera = store.cargar()
  await store.cargar()
  completarPrimera({ datasetDisponible: true })
  await primera
  assert.equal(store.estado, 'sin_dataset')
  assert.equal(store.resumen, null)
})

test('el mapa carga todas las páginas y valida referencias', async () => {
  const { cargarMapa } = await server.ssrLoadModule('/src/application/use-cases/cargarMapa.ts')
  const { leerRed, leerNodos } = await server.ssrLoadModule('/src/infrastructure/api/dtos.ts')
  const nodos = Array.from({ length: 2001 }, (_, i) => ({ id: String(i), lat: -12.1, lon: -77 }))
  const red = { type: 'FeatureCollection', features: [{ type: 'Feature',
    geometry: { type: 'LineString', coordinates: [[-77, -12.1], [-77.01, -12.11]] },
    properties: { origen: '0', destino: '2000', longitud_m: 100, nombre: 'Prueba', sentido_unico: true } }] }
  const offsets = []
  const repository = { obtenerRed: async () => leerRed(red), obtenerNodos: async (offset, limite) => {
    offsets.push(offset)
    return leerNodos({ total: 2001, nodos: nodos.slice(offset, offset + limite) })
  } }
  const resumen = { cantidadNodos: 2001, cantidadAristas: 1 }
  const data = await cargarMapa(repository, resumen)
  assert.equal(data.nodos.length, 2001)
  assert.deepEqual(offsets, [0, 2000])
  await assert.rejects(cargarMapa({ ...repository, obtenerNodos: async () => ({ total: 2001, nodos: [] }) }, resumen), /incompleta/)
  await assert.rejects(cargarMapa({ ...repository, obtenerNodos: async () => ({ total: 2001, nodos: [nodos[0], nodos[0]] }) }, resumen), /duplicados/)
  await assert.rejects(cargarMapa(repository, { ...resumen, cantidadAristas: 2 }), /no coincide/)
  assert.throws(() => leerNodos({ total: 1, nodos: [{ id: '1', lat: 91, lon: -77 }] }))
  assert.throws(() => leerRed({ ...red, features: [{ ...red.features[0], geometry: { type: 'LineString', coordinates: [[-77, NaN]] } }] }))
})

test('selección de depósito y límites de entregas', async () => {
  const { createPinia } = await import('pinia')
  const { usePlanificadorStore } = await server.ssrLoadModule('/src/application/stores/planificadorStore.ts')
  const plan = usePlanificadorStore(createPinia())
  const nodo = id => ({ id, lat: -12.1, lon: -77 })
  plan.seleccionarNodo(nodo('origen'))
  assert.equal(plan.seleccionActiva, 'destino')
  plan.seleccionarNodo(nodo('origen'))
  assert.equal(plan.destinos.length, 0)
  assert.match(plan.errorSeleccion, /distinto/)
  plan.seleccionarNodo(nodo('a'))
  plan.seleccionarNodo(nodo('b'))
  assert.deepEqual(plan.destinos.map(n => n.id), ['b'])
  plan.cambiarTipo('multi_entrega')
  plan.seleccionarNodo(nodo('b'))
  assert.match(plan.errorSeleccion, /ya está/)
  for (let i = 0; i < 12; i++) plan.seleccionarNodo(nodo(String(i)))
  assert.equal(plan.destinos.length, 12)
  assert.match(plan.errorSeleccion, /hasta 12/)
  plan.cambiarTipo('punto_a_punto')
  assert.equal(plan.destinos.length, 1)
  plan.seleccionActiva = 'origen'
  plan.seleccionarNodo(nodo('b'))
  assert.equal(plan.destinos.length, 0)
  plan.limpiar()
  assert.equal(plan.origen, null)
  assert.equal(plan.seleccionActiva, 'origen')
})
