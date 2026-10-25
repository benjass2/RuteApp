# RUTEA · Frontend, etapa 5

Aplicación académica de rutas en Miraflores y San Isidro. Vue 3 + TypeScript +
Vite dentro de `frontend/`; FastAPI y datos OpenStreetMap en `../backend/`.

La base utiliza PrimeVue 4, tema Aura personalizado, PrimeIcons y Pinia 3.
Las versiones resueltas están en el lockfile único `../package-lock.json`. La pantalla permite cambiar
modalidad y minuto de salida. Consulta `/api/health` y `/api/grafo/resumen`
al abrirse, mostrando conteos y atribución reales. Después descarga la red vial
GeoJSON y todos los nodos paginados para dibujar el mapa con Leaflet 1.9.4.
Pinia mantiene la selección hasta recargar la página.

## Arquitectura

| Carpeta | Responsabilidad |
| --- | --- |
| `src/app` | Arranque y composición de dependencias de la aplicación. |
| `src/planificacion-rutas/domain` | Modelos y contratos del bounded context. |
| `src/planificacion-rutas/application` | Casos de uso y stores Pinia. |
| `src/planificacion-rutas/infrastructure` | Adaptador y DTOs específicos de la API. |
| `src/planificacion-rutas/presentation` | Vistas, componentes y estilos del contexto. |
| `src/shared` | Utilidades de dominio, transporte HTTP y presentación comunes. |

`main.ts` delega en `src/app/bootstrap.ts`, que registra Pinia y PrimeVue. El tema está en
`src/shared/presentation/theme/ruteaTheme.ts`. `src/app/presentation/App.vue` monta Dashboard; los componentes
PrimeVue se importan individualmente. Las carpetas de etapas siguientes tienen
README con su responsabilidad. Leaflet se carga de forma diferida con MapViewer.
La distribución completa y las reglas de dependencia están en [src/README.md](src/README.md).

## Backend y proxy local

Instalación y datos: ver [backend/README.md](../backend/README.md). Desde la raíz del repositorio, en otra terminal:

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --reload
```

El servidor Vite redirige `/api/*` a `http://127.0.0.1:8000`, preservando `/api`.
El proxy solo funciona durante desarrollo. `vercel.json` prepara el enrutamiento
de producción; aún debe validarse con una build/preview de Vercel.
Sin FastAPI, muestra error y permite reintentar.

El repositorio HTTP adapta los campos snake_case a modelos del dominio y valida
el JSON recibido. El cliente tiene timeout de 15 segundos, cancelación y manejo
de errores de red, HTTP y validación de FastAPI. Los mensajes se renderizan como
texto. El store cancela peticiones previas e ignora respuestas obsoletas.
Las dependencias se proporcionan desde `main.ts` mediante inyección: application
depende del contrato del dominio, sin importar adaptadores de infrastructure.
Si health indica dataset ausente, no se solicita el resumen ni se muestran ceros
como si fueran datos reales. El reintento es manual, sin consultas periódicas.

```sh
npm run test:frontend
```

Las pruebas usan el runner nativo de Node y Vite para cargar los módulos TypeScript.

## Próximos pasos

1. Ejecutar una build/preview de Vercel y verificar el empaquetado y las rutas.
2. Experimentación reproducible y estimación ambiental con el backend.

## Mapa y selección

En monitores desde 1200 px la aplicación ocupa toda la ventana (`100dvh`),
con controles a la izquierda, mapa flexible al centro y métricas a la derecha.
Los paneles laterales tienen scroll independiente. En pantallas intermedias
las métricas pasan debajo del mapa; en móvil se apilan las tres zonas.
El panel de resultados muestra un estado vacío hasta calcular una ruta,
después presenta las métricas reales de FastAPI y la secuencia de visitas.

La red se dibuja sobre el mapa de calles de OpenStreetMap mediante Leaflet.
El selector «Solo grafo» permite usar un fondo local sin teselas externas.
Las coordenadas GeoJSON usan [longitud, latitud]; los puntos Leaflet usan
[latitud, longitud]. Canvas renderiza calles e intersecciones; su tamaño varía
con el zoom. ResizeObserver ajusta el mapa a su contenedor y al desmontar se
eliminan observador, capas y eventos de Leaflet. Sus instancias no van a Pinia.

Seleccionar una intersección marca primero el depósito y después el destino.
Los botones Depósito/Destino permiten elegir qué punto se modifica. También se
pueden filtrar los selectores por ID OSM, con listas virtualizadas. En punto a
punto se reemplaza el destino; en multi-entrega se agregan hasta 12 sin duplicados.
El depósito no puede ser una entrega. Cambiar a punto a punto conserva solo la
primera entrega. Cambiar el depósito elimina esa intersección de los destinos.
Limpiar selección borra ambos; actualizar los datos del grafo también los limpia.
Los números de entrega indican selección, todavía no orden optimizado.

El estado del mapa es independiente del resumen: si falla el GeoJSON o la
paginación, el resumen permanece visible y se puede reintentar solo el mapa.
Se comprueban coordenadas, IDs, conteos y referencias entre calles y nodos,
incluidas páginas vacías o duplicadas. Las peticiones y respuestas obsoletas
se cancelan o ignoran. La preparación requiere FastAPI activo en el puerto 8000.
La vista permite calcular rutas con los endpoints POST del backend.

## Cálculo y resultados

Selecciona depósito y destino(s), hora y algoritmo en el panel izquierdo.
Punto a punto permite Dijkstra o Bellman-Ford. Multi-entrega permite Held-Karp
(hasta 12 paradas) o backtracking (hasta 8), con retorno opcional al depósito.
El botón explica los datos que faltan y permanece deshabilitado si no se cumplen
las restricciones o el mapa no está listo. La validación definitiva sigue en FastAPI.

El cliente envía únicamente los campos admitidos por cada endpoint. Valida algoritmo,
hora, extremos, secuencia de entregas, métricas finitas y geometría antes de adaptar
la respuesta a modelos del dominio. No se usan conversiones de tipos como sustituto
de validación en ejecución. El cliente HTTP admite GET y POST con JSON.

El mapa dibuja el recorrido, encuadra su geometría y numera las entregas según
el orden calculado. El listado de paradas y los marcadores reflejan ese orden sin
alterar los parámetros de entrada. Un empate puede producir órdenes distintos entre
motores con el mismo costo óptimo.

Cambiar modalidad, puntos, hora, motor o retorno cancela el cálculo e invalida
resultado, línea y métricas. Las respuestas tardías se ignoran. El usuario también
puede cancelar manualmente; se conservan sus puntos en errores y reintentos.
Un error 404 informa ausencia de ruta dirigida; no se genera una línea ficticia.

Las métricas distinguen distancia física, costo ponderado y tiempo del caso de uso.
También se muestra tiempo exclusivo del algoritmo y de preparación de la matriz
en multi-entrega. El contador es nodos para caminos mínimos y estados para TSP;
no representa operaciones equivalentes entre motores. No es tiempo de viaje.
El tráfico es simulado y permanece fijo durante el recorrido.
Las pruebas cubren contratos POST, errores, secuencias inválidas, límites y
cancelación por cambios de parámetros.

## Comparación, conectividad y capas

`Comparar algoritmos` invoca el endpoint comparativo del modo activo con los
mismos puntos, hora y retorno. No envía `algoritmo`, porque ambos motores se
ejecutan siempre. En multi-entrega admite hasta 8 paradas y comparte la matriz
de caminos mínimos. La tabla compara tiempo exclusivo del motor y costo
ponderado; seleccionar una fila muestra esa ruta y sus métricas. El selector
del panel sigue definiendo el motor de futuros cálculos individuales.
Los costos equivalentes admiten tolerancia numérica y pueden tener distinto
orden de visitas. Los tiempos son muestras individuales, no un benchmark
estadístico; los contadores de nodos/estados no se comparan como trabajo idéntico.

En `Análisis del grafo`, dentro del panel izquierdo:

- `Verificar UFDS`: comprueba componente débil para depósito y destinos.
  Pertenecer a la misma componente no garantiza una ruta dirigida válida.
- `Red troncal MST`: consulta Kruskal y dibuja un bosque mínimo no dirigido,
  independiente del tráfico. Informa componentes y longitud física.
- `Sectores geográficos`: colorea nodos por SO, SE, NO y NE con conteos reales.
  No restringe las rutas ni asigna vehículos automáticamente.

Las capas se cargan bajo demanda, tienen errores independientes y se guardan
en memoria durante la sesión. Desactivarlas cancela una petición pendiente.
Actualizar los datos del grafo limpia caché, resultados UFDS y capas; cambiar
puntos invalida UFDS. Las respuestas obsoletas no vuelven a activar una capa.
El orden de dibujo es calles, MST, intersecciones, ruta calculada y marcadores.

El fondo predeterminado utiliza `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
y necesita Internet. Muestra calles, parques y nombres; no es una vista satelital.
Se conserva la atribución visible de OpenStreetMap y la caché normal del navegador,
sin descargas masivas ni precarga offline de teselas. Consulta la
[política de teselas](https://operations.osmfoundation.org/policies/tiles/).
La selección de intersecciones, las rutas y las capas analíticas usan el dataset local.

En «Solo grafo» el mapa no requiere teselas externas. CO₂ y experimentos reproducibles
siguen pendientes del backend.

## Despliegue preparado

La función `api/index.py` en la raíz del repositorio reutiliza el backend existente, con el dataset local
incluido expresamente y Python 3.13. El frontend mantiene su ubicación y build
Vite. La salida está en `frontend/dist`. No se descargan datos OSM ni se instala OSMnx durante el arranque.
La configuración y los pasos pendientes están en [docs/DESPLIEGUE.md](../docs/DESPLIEGUE.md).

Después de compilar, se puede verificar localmente la entrada ASGI y los datos:

```powershell
.\.venv\Scripts\python backend/scripts/verificar_despliegue.py
```

Este comando no publica el sitio ni valida el router/CDN de la plataforma.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
