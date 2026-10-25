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
  ;({ HttpClient, HttpError } = await server.ssrLoadModule('/src/shared/infrastructure/http/httpClient.ts'))
  ;({ leerEstado, leerResumen } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/dtos.ts'))
  ;({ cargarEstadoGrafo } = await server.ssrLoadModule('/src/planificacion-rutas/application/use-cases/cargarGrafo.ts'))
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
  await assert.rejects(new HttpClient().get('/health'), /servidor/)
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
  const { HttpRuteaRepository } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/HttpRuteaRepository.ts')
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
  const { ruteaRepositoryKey } = await server.ssrLoadModule('/src/planificacion-rutas/application/ports/dependencies.ts')
  const { useGrafoStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/grafoStore.ts')
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
  const { cargarMapa } = await server.ssrLoadModule('/src/planificacion-rutas/application/use-cases/cargarMapa.ts')
  const { leerRed, leerNodos } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/dtos.ts')
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
  const { usePlanificadorStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/planificadorStore.ts')
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

const solicitudPunto = { tipo: 'punto_a_punto', origen: 'a', destino: 'b', minutoDia: 480, algoritmo: 'dijkstra' }
const respuestaPunto = { algoritmo: 'dijkstra', origen: 'a', destino: 'b', minuto_dia: 480,
  trafico: 'simulado', nodos: ['a', 'b'], distancia_km: .15, costo_ponderado_m: 300,
  tiempo_ms: 1, tiempo_algoritmo_ms: .5, nodos_evaluados: 3,
  geometria: { type: 'LineString', coordinates: [[-77, -12.1], [-77.01, -12.11]] } }

test('POST usa el contrato exacto y preserva errores 404', async () => {
  const { HttpRuteaRepository } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/HttpRuteaRepository.ts')
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/rutas/punto-a-punto')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(options.body), { origen: 'a', destino: 'b', minuto_dia: 480, algoritmo: 'dijkstra' })
    return Response.json(respuestaPunto)
  }
  const repo = new HttpRuteaRepository(new HttpClient())
  const result = await repo.calcularRuta(solicitudPunto)
  assert.equal(result.distanciaKm, .15)
  assert.equal(result.unidadEvaluados, 'nodos')
  globalThis.fetch = async () => Response.json({ detail: 'No existe ruta dirigida' }, { status: 404 })
  await assert.rejects(repo.calcularRuta(solicitudPunto), error => error.status === 404 && /dirigida/.test(error.message))
})

test('valida respuestas de ruta y secuencias multi-entrega', async () => {
  const { leerRuta } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/rutaDTO.ts')
  for (const override of [{ distancia_km: NaN }, { nodos: ['b', 'a'] }, { algoritmo: 'otro' },
    { geometria: { type: 'LineString', coordinates: [[-77, 91], [-77, -12]] } }]) {
    assert.throws(() => leerRuta({ ...respuestaPunto, ...override }, solicitudPunto))
  }
  const solicitud = { tipo: 'multi_entrega', origen: 'a', destinos: ['b', 'c'], minutoDia: 480,
    algoritmo: 'held_karp', volverOrigen: true }
  const respuesta = { ...respuestaPunto, algoritmo: 'held_karp', volver_origen: true,
    orden_visita: ['a', 'c', 'b', 'a'], nodos: ['a', 'c', 'b', 'a'],
    tiempo_matriz_ms: .2, estados_evaluados: 5 }
  const result = leerRuta(respuesta, solicitud)
  assert.equal(result.unidadEvaluados, 'estados')
  assert.deepEqual(result.ordenVisita, ['a', 'c', 'b', 'a'])
  assert.throws(() => leerRuta({ ...respuesta, orden_visita: ['a', 'c', 'c', 'a'] }, solicitud))
  const { HttpRuteaRepository } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/HttpRuteaRepository.ts')
  const repo = new HttpRuteaRepository({ post: async (path, body) => {
    assert.equal(path, '/rutas/multi-entrega')
    assert.deepEqual(body, { origen: 'a', destinos: ['b', 'c'], algoritmo: 'held_karp', minuto_dia: 480, volver_origen: true })
    return respuesta
  } })
  assert.equal((await repo.calcularRuta(solicitud)).evaluados, 5)
})

test('límites del cálculo y retorno al depósito', async () => {
  const { validarSolicitudRuta } = await server.ssrLoadModule('/src/planificacion-rutas/application/use-cases/calcularRuta.ts')
  const multi = { tipo: 'multi_entrega', origen: 'a', destinos: Array.from({ length: 9 }, (_, i) => String(i)),
    algoritmo: 'backtracking', minutoDia: 480, volverOrigen: false }
  assert.throws(() => validarSolicitudRuta(multi), /8 entregas/)
  validarSolicitudRuta({ ...multi, algoritmo: 'held_karp' })
  assert.throws(() => validarSolicitudRuta({ ...solicitudPunto, destino: 'a' }), /distintas/)
  assert.throws(() => validarSolicitudRuta({ ...solicitudPunto, minutoDia: 1440 }), /hora/)
})

test('cambiar parámetros invalida una respuesta tardía y permite reintentar', async () => {
  const { createApp } = await import('vue')
  const { createPinia } = await import('pinia')
  const { ruteaRepositoryKey } = await server.ssrLoadModule('/src/planificacion-rutas/application/ports/dependencies.ts')
  const { usePlanificadorStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/planificadorStore.ts')
  const { useRutasStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/rutasStore.ts')
  let completar
  let signal
  const repository = { calcularRuta: async (_payload, inputSignal) => {
    signal = inputSignal
    return new Promise(resolve => { completar = resolve })
  } }
  const pinia = createPinia()
  const app = createApp({}).use(pinia).provide(ruteaRepositoryKey, repository)
  const plan = usePlanificadorStore(pinia)
  const rutas = app.runWithContext(() => useRutasStore(pinia))
  plan.seleccionarNodo({ id: 'a', lat: -12, lon: -77 })
  plan.seleccionarNodo({ id: 'b', lat: -12.1, lon: -77 })
  const primera = rutas.calcular()
  assert.equal(rutas.estado, 'cargando')
  plan.cambiarMinuto(600)
  assert.equal(signal.aborted, true)
  completar({ distanciaKm: 99 })
  await primera
  assert.equal(rutas.resultado, null)
  assert.equal(rutas.estado, 'inicial')
  repository.calcularRuta = async () => { throw new Error('Sin ruta dirigida') }
  await rutas.calcular()
  assert.equal(rutas.estado, 'error')
  assert.equal(plan.destinos[0].id, 'b')
  repository.calcularRuta = async () => ({ distanciaKm: 1 })
  await rutas.calcular()
  assert.equal(rutas.estado, 'listo')
  plan.algoritmoPunto = 'bellman_ford'
  assert.equal(rutas.resultado, null)
  pinia._s.forEach(store => store.$dispose())
})

test('comparaciones envían los mismos parámetros sin campo algoritmo', async () => {
  const { HttpRuteaRepository } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/HttpRuteaRepository.ts')
  const { leerComparacion } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/analisisDTO.ts')
  const response = { resultados: [respuestaPunto, { ...respuestaPunto, algoritmo: 'bellman_ford' }], costos_equivalentes: true }
  const repo = new HttpRuteaRepository({ post: async (path, body) => {
    assert.equal(path, '/rutas/comparar')
    assert.deepEqual(body, { origen: 'a', destino: 'b', minuto_dia: 480 })
    return response
  } })
  assert.equal((await repo.compararRutas(solicitudPunto)).resultados[1].algoritmo, 'bellman_ford')
  assert.throws(() => leerComparacion({ ...response, costos_equivalentes: false }, solicitudPunto))
  assert.throws(() => leerComparacion({ ...response, resultados: [respuestaPunto] }, solicitudPunto))
  const solicitud = { tipo: 'multi_entrega', origen: 'a', destinos: ['b'], minutoDia: 480, algoritmo: 'held_karp', volverOrigen: false }
  const multi = { ...respuestaPunto, orden_visita: ['a', 'b'], volver_origen: false, tiempo_matriz_ms: .2, estados_evaluados: 1 }
  const multiRepo = new HttpRuteaRepository({ post: async (path, body) => {
    assert.equal(path, '/rutas/multi-entrega/comparar')
    assert.equal('algoritmo' in body, false)
    return { resultados: [{ ...multi, algoritmo: 'held_karp' }, { ...multi, algoritmo: 'backtracking' }], costos_equivalentes: true }
  } })
  assert.equal((await multiRepo.compararRutas(solicitud)).resultados[0].unidadEvaluados, 'estados')
})

test('contratos UFDS, MST y sectores rechazan datos inconsistentes', async () => {
  const { leerConectividad, leerMST, leerSectores } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/analisisDTO.ts')
  const ufds = { origen: 'a', tipo: 'debil', garantiza_ruta_dirigida: false, destinos: [{ id: 'b', misma_componente: true }] }
  assert.equal(leerConectividad(ufds, 'a', ['b']).destinos[0].mismaComponente, true)
  assert.throws(() => leerConectividad({ ...ufds, garantiza_ruta_dirigida: true }, 'a', ['b']))
  assert.throws(() => leerConectividad(ufds, 'a', ['c']))
  const red = { type: 'FeatureCollection', features: [] }
  const mst = { algoritmo: 'kruskal', proyeccion: 'no_dirigida', criterio_peso: 'longitud_m', nodos: 2,
    aristas_seleccionadas: 0, componentes: 2, distancia_km: 0, tiempo_ms: 1, es_arbol: false, es_conexo: false, geojson: red }
  assert.equal(leerMST(mst).componentes, 2)
  assert.throws(() => leerMST({ ...mst, aristas_seleccionadas: 1 }))
  const sectores = { sectores: ['SO', 'SE', 'NO', 'NE'].map((id, i) => ({ id, nodos: [String(i)], total: 1 })) }
  assert.equal(leerSectores(sectores).length, 4)
  assert.throws(() => leerSectores({ sectores: sectores.sectores.slice(1) }))
  assert.throws(() => leerSectores({ sectores: sectores.sectores.map(s => ({ ...s, nodos: ['repetido'] })) }))
})

test('la comparación conserva ambas rutas y se invalida al cambiar la hora', async () => {
  const { createApp } = await import('vue')
  const { createPinia } = await import('pinia')
  const { ruteaRepositoryKey } = await server.ssrLoadModule('/src/planificacion-rutas/application/ports/dependencies.ts')
  const { usePlanificadorStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/planificadorStore.ts')
  const { useRutasStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/rutasStore.ts')
  const { leerRuta } = await server.ssrLoadModule('/src/planificacion-rutas/infrastructure/api/rutaDTO.ts')
  const a = leerRuta(respuestaPunto, solicitudPunto)
  const b = { ...a, algoritmo: 'bellman_ford' }
  const pinia = createPinia()
  const app = createApp({}).use(pinia).provide(ruteaRepositoryKey, { compararRutas: async () => ({ resultados: [a, b], costosEquivalentes: true }) })
  const plan = usePlanificadorStore(pinia)
  const rutas = app.runWithContext(() => useRutasStore(pinia))
  plan.seleccionarNodo({ id: 'a', lat: -12, lon: -77 }); plan.seleccionarNodo({ id: 'b', lat: -12.1, lon: -77 })
  await rutas.comparar()
  assert.equal(rutas.resultado.algoritmo, 'dijkstra')
  rutas.mostrarResultado('bellman_ford')
  assert.equal(rutas.resultado.algoritmo, 'bellman_ford')
  assert.equal(rutas.comparacion.resultados.length, 2)
  plan.cambiarMinuto(600)
  assert.equal(rutas.comparacion, null)
  rutas.$dispose(); plan.$dispose()
})

test('análisis cancela capas obsoletas y conserva caché de la sesión', async () => {
  const { createApp } = await import('vue')
  const { createPinia } = await import('pinia')
  const { ruteaRepositoryKey } = await server.ssrLoadModule('/src/planificacion-rutas/application/ports/dependencies.ts')
  const { useGrafoStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/grafoStore.ts')
  const { usePlanificadorStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/planificadorStore.ts')
  const { useAnalisisStore } = await server.ssrLoadModule('/src/planificacion-rutas/application/stores/analisisStore.ts')
  let completar, signal, lecturas = 0
  const mst = { nodos: 2, aristas: 0, componentes: 2, distanciaKm: 0, tiempoMs: 1, esArbol: false, red: { type: 'FeatureCollection', features: [] } }
  const repository = { obtenerMST: async inputSignal => { signal = inputSignal; return new Promise(resolve => { completar = resolve }) },
    verificarConectividad: async (origen, destinos) => ({ origen, destinos: destinos.map(id => ({ id, mismaComponente: true })) }) }
  const pinia = createPinia()
  const app = createApp({}).use(pinia).provide(ruteaRepositoryKey, repository)
  const grafo = app.runWithContext(() => useGrafoStore(pinia))
  const analisis = app.runWithContext(() => useAnalisisStore(pinia))
  const plan = usePlanificadorStore(pinia)
  const mapa = { nodos: [{ id: 'a', lat: -12, lon: -77 }, { id: 'b', lat: -12.1, lon: -77 }], red: mst.red }
  grafo.mapa = mapa
  const pending = analisis.cambiarMST(true)
  grafo.mapa = null
  assert.equal(signal.aborted, true)
  completar(mst); await pending
  assert.equal(analisis.mst, null)
  assert.equal(analisis.mstVisible, false)
  grafo.mapa = mapa
  repository.obtenerMST = async () => { lecturas++; return mst }
  await analisis.cambiarMST(true); await analisis.cambiarMST(false); await analisis.cambiarMST(true)
  assert.equal(lecturas, 1)
  plan.seleccionarNodo(mapa.nodos[0]); plan.seleccionarNodo(mapa.nodos[1])
  await analisis.verificarUFDS()
  assert.equal(analisis.conectividad.destinos[0].mismaComponente, true)
  plan.quitarDestino('b')
  assert.equal(analisis.conectividad, null)
  analisis.$dispose(); grafo.$dispose(); plan.$dispose()
})
