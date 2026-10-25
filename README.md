# RUTEA

Plataforma académica de optimización de rutas urbanas en Miraflores y San Isidro.
Monorepo Vue 3 + TypeScript + FastAPI, con dataset OpenStreetMap local.

## Funcionalidades

- Selección de depósito y destinos desde las intersecciones del mapa o por ID OSM.
- Rutas punto a punto con Dijkstra y Bellman-Ford.
- Planificación de múltiples entregas con Held-Karp o backtracking y retorno opcional al depósito.
- Comparación de algoritmos con los mismos puntos y hora de salida.
- Visualización del recorrido, orden de visitas, distancia, costo ponderado y tiempos de ejecución.
- Conectividad con UFDS, bosque de expansión mínima con Kruskal y zonificación geográfica.
- Mapa de calles OpenStreetMap con Leaflet y alternativa «Solo grafo» sin teselas externas.

## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Interfaz | Vue 3, TypeScript, PrimeVue 4 y PrimeIcons |
| Estado y compilación | Pinia 3, Vite y npm workspaces |
| Mapas | Leaflet, GeoJSON y OpenStreetMap |
| API | Python, FastAPI y Pydantic |
| Preparación del dataset | OSMnx, utilizado únicamente para descargar y procesar datos |
| Pruebas | Node Test Runner y unittest de Python |

## Arquitectura

El frontend concentra el bounded context en `frontend/src/planificacion-rutas`,
con capas `domain`, `application`, `infrastructure` y `presentation`.
`src/app` compone las dependencias y `src/shared` reúne las utilidades, HTTP,
el tema y los estilos comunes.

El backend separa algoritmos y entidades en `app/domain`, servicios y DTOs en
`app/application`, persistencia en `app/infrastructure` y endpoints en `app/api`.
Carga el grafo desde JSON en memoria, sin requerir una base de datos. El cliente
se comunica con FastAPI mediante `/api`.

```text
ruteapp/
├── frontend/            # Vue, Vite, código, pruebas y configuración del cliente
│   ├── src/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── vite.config.ts
├── backend/             # FastAPI, algoritmos, dataset, pruebas y herramientas Python
│   ├── app/
│   ├── dataset/
│   ├── scripts/
│   ├── tests/
│   └── main.py
├── api/index.py         # Adaptador de entrada requerido por Vercel
├── docs/                # Documentación transversal y despliegue
├── package.json         # Workspace npm y comandos de todo el repositorio
├── package-lock.json    # Lockfile único del workspace
├── requirements.txt     # Dependencias Python descubiertas por Vercel
└── vercel.json          # Configuración conjunta de frontend y API
```

## Requisitos e instalación

- Node.js `^22.18.0` o `>=24.12.0`, con npm.
- Python 3.11 o superior. El despliegue está configurado con Python 3.13.
- Internet para instalar dependencias y cargar el fondo de OpenStreetMap.

Ejecutar desde la raíz del repositorio, utilizando PowerShell en Windows:

```powershell
npm ci
py -m venv .venv
.\.venv\Scripts\python -m pip install -r backend/requirements-dev.txt
```

El dataset procesado está incluido en `backend/dataset/dataset_grafo.json`.
No es necesario descargarlo nuevamente para ejecutar la aplicación. Para
regenerarlo, consultar el [README del backend](backend/README.md).

En Linux o macOS, crear el entorno con `python3 -m venv .venv` y sustituir
`.\.venv\Scripts\python` por `.venv/bin/python` en los comandos Python.

## Desarrollo local

Desde la raíz del repositorio:

```sh
npm run dev
```

En otra terminal, iniciar FastAPI:

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --reload
```

Vite conserva el proxy `/api` a `http://127.0.0.1:8000`. Los comandos npm de la
raíz delegan en el workspace `frontend`; también pueden ejecutarse desde esa carpeta.

Abrir la URL indicada por Vite, normalmente `http://localhost:5173`.
La API se puede comprobar en `http://127.0.0.1:8000/api/health` y su documentación
interactiva está en `http://127.0.0.1:8000/docs`.

Si aparece **HTTP 502**, comprobar que FastAPI está activo en el puerto 8000 y
reintentar la conexión desde el panel.

### Primer recorrido

1. Esperar a que el estado indique «Conectado» y se carguen las intersecciones.
2. Hacer clic en una intersección para seleccionar el depósito y en otra para el destino.
3. Elegir la hora y el algoritmo, y pulsar «Calcular ruta óptima».
4. Consultar el recorrido y las métricas del panel de resultados.

Los puntos están visibles por defecto. Si se ocultaron, activar «Mostrar
intersecciones». Para varias entregas, cambiar a «Multi-entrega» antes de
seleccionar los destinos.

## Algoritmos y alcance

| Algoritmo | Aplicación | Límite o consideración |
| --- | --- | --- |
| Dijkstra | Camino mínimo dirigido | Pesos positivos por longitud y tráfico simulado |
| Bellman-Ford | Camino mínimo y comparación | El dataset validado no admite longitudes negativas |
| Held-Karp | Orden óptimo de entregas | Hasta 12 destinos |
| Backtracking con poda | Orden óptimo por búsqueda exhaustiva | Hasta 8 destinos |
| UFDS | Componentes conexas débiles | No garantiza accesibilidad dirigida |
| Kruskal | Bosque de expansión mínima | Proyección no dirigida, ponderada por longitud física |
| Divide y vencerás | Zonificación en cuatro sectores | No asigna vehículos ni restringe rutas |

La comparación multi-entrega admite hasta 8 destinos. La red incluida contiene
2 726 nodos y 5 387 arcos dirigidos; los conteos pueden cambiar al regenerarla.
Se conservan sentidos de circulación, aristas paralelas y geometrías viales.

El tráfico horario es **simulado**, no información en tiempo real. La hora
permanece fija durante el recorrido. El costo ponderado no representa minutos
de viaje y los tiempos de ejecución son muestras individuales, no un benchmark
estadístico. No se contemplan capacidad de vehículos ni ventanas horarias.

Los datos proceden de [OpenStreetMap y sus colaboradores](https://www.openstreetmap.org/copyright),
bajo ODbL. El fondo de calles requiere Internet y está sujeto a la
[política de teselas de OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).
El motor de rutas y las capas del grafo utilizan datos locales.

## Validación

```powershell
npm run test:frontend
npm run build
.\.venv\Scripts\python -m unittest discover -s backend/tests -v
.\.venv\Scripts\python backend/scripts/verificar_despliegue.py
```

La build se genera en `frontend/dist`. La instalación del workspace mantiene
las dependencias compartidas en `node_modules` en la raíz; no mover esa carpeta
manualmente. `dist`, `node_modules`, `.venv`, cachés y metadatos de editores son
archivos de trabajo, no capas de la aplicación. Están ignorados por Git cuando
corresponde. Las carpetas de herramientas `.git`, `.agents`, `.codex`, `.idea`,
`.vscode` y `.impeccable` conservan su ubicación para su descubrimiento automático.

El verificador de despliegue requiere la build del frontend y comprueba
localmente la entrada ASGI, el dataset y los endpoints; no publica la aplicación
ni valida el router de Vercel.

## Documentación técnica

- [Frontend y funcionalidades](frontend/README.md)
- [Bounded context y shared](frontend/src/README.md)
- [Backend, instalación y API](backend/README.md)
- [Preparación del despliegue](docs/DESPLIEGUE.md)

## Estado y trabajo pendiente

La planificación, comparación y análisis del grafo están implementados para
ejecución local.

El motor y las capas del grafo funcionan con datos locales. El fondo de calles
OpenStreetMap necesita Internet; «Solo grafo» permite ver la red sin teselas externas. CO₂ y experimentos
reproducibles siguen pendientes. Vercel está configurado, pero todavía requiere
validación de empaquetado y rewrites en una build/preview de la plataforma.
