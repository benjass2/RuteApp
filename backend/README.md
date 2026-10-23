# RUTEA · Backend, etapa 3

Python 3.11 o superior. Ejecutar comandos desde la raíz del repositorio.
Se conserva `backend/` existente: dominio puro en `app/domain`, casos de uso
en `app/application`, adaptadores en `app/infrastructure` y HTTP en `app/api`.

## Instalación y preparación

```powershell
py -m venv .venv
.\.venv\Scripts\python -m pip install -r backend/requirements-dev.txt -r dataset/requirements.txt
.\.venv\Scripts\python dataset/script_descarga.py
.\.venv\Scripts\python -m uvicorn backend.main:app --reload
```

La descarga consulta OpenStreetMap mediante OSMnx para Miraflores y San Isidro.
Requiere conexión y puede tardar varios minutos. El JSON real se genera en
`dataset/dataset_grafo.json`; no se incluye un grafo sintético como sustituto.
El script exige al menos 1500 nodos y 3400 aristas antes de guardar; si la
cobertura actual no alcanza esos valores, informa el error sin sobrescribir datos.

Cada elemento de `aristas` representa un arco dirigido, incluso en calles de
doble sentido (OSMnx exporta ambos arcos). Se mantienen aristas paralelas y
geometría [longitud, latitud]. No volver a duplicar las calles bidireccionales.
La fuente y la atribución ODbL se conservan en los metadatos.

## API

- `GET /api/health`: proceso activo y disponibilidad del dataset.
- `GET /api/grafo/resumen`: conteos reales y atribución.
- `GET /api/grafo/nodos?offset=0&limite=100`: nodos paginados.
- `GET /api/grafo/geojson`: calles para Leaflet.
- `/docs`: documentación interactiva OpenAPI.

El repositorio carga y valida el archivo una vez por proceso al iniciar.
Sin dataset válido, los endpoints del grafo responden 503; health sigue operativo.
Tras descargar o reemplazar el archivo, reiniciar el proceso.
`RUTEA_DATASET_PATH` permite configurar otra ruta local.
OSMnx solo se usa para preprocesar; el runtime no hace consultas externas.

## Verificación

```powershell
.\.venv\Scripts\python -m unittest discover -s backend/tests -v
```

## Rutas punto a punto

`POST /api/rutas/punto-a-punto`:

```json
{"origen": "ID_OSM_ORIGEN", "destino": "ID_OSM_DESTINO", "minuto_dia": 480, "algoritmo": "dijkstra"}
```

Usar IDs de `/api/grafo/nodos`. `minuto_dia` es un entero entre 0 y 1439
(480 = 08:00, 1439 = 23:59). La respuesta contiene secuencia de nodos,
geometría GeoJSON, `distancia_km` física, `costo_ponderado_m`, `tiempo_ms`
y `nodos_evaluados` (extracciones definitivas de la cola, incluido el destino).
Si origen y destino coinciden, devuelve distancia cero y geometría Point.
422 indica parámetros o nodos inválidos, 404 ausencia de ruta y 503 dataset ausente.

`POST /api/grafo/conectividad`:

```json
{"origen": "ID_OSM_ORIGEN", "destinos": ["ID_OSM_DESTINO"]}
```

UFDS construye una componente débil ignorando la dirección, con compresión
de caminos y unión por tamaño. La consulta tiene costo amortizado O(α(V));
la construcción inicial O((V+E) α(V)). Pertenecer a la misma componente
es necesario, pero no garantiza accesibilidad dirigida: Dijkstra la verifica.
La adyacencia y el índice UFDS se construyen una vez al iniciar el proceso.

### Tráfico académico y medición

OpenStreetMap proporciona red vial, no tráfico horario en tiempo real.
El factor determinista vale 1 fuera de horas punta, con picos triangulares
a las 08:00 (06:00–10:00) y 18:00 (15:00–21:00). En el pico vale 2 para
calles y 2.5 para nombres que contienen Avenida o empiezan por Av./Av.
El costo es longitud × factor; la hora permanece fija durante el recorrido.
Es una hipótesis académica, no una calibración de tráfico de Lima.

Dijkstra usa `heapq` y conserva el arco predecesor exacto para respetar las
aristas paralelas. Con esta cola de entradas diferidas su cota general es
O((V+E) log(V+E)), y O(V+E) de espacio, equivalente a O((V+E) log V)
para grafos simples. `tiempo_ms` mide validación, algoritmo y armado del
resultado; excluye arranque, serialización HTTP y transporte. El costo ponderado
no se interpreta como minutos. La estimación de CO₂ requiere una línea base
y un factor de emisiones explícitos, por lo que aún no se calcula.

## Bellman-Ford y comparación

El endpoint punto a punto admite también `"algoritmo": "bellman_ford"`.
Bellman-Ford relaja todos los arcos hasta V−1 pasadas, con parada anticipada
cuando no hay cambios, y precalcula los pesos horarios. Su cota es O(V E)
y su memoria O(V+E). El repositorio exige longitudes positivas y el factor
es positivo: este dominio no admite pesos ni ciclos negativos.

`POST /api/rutas/comparar` ejecuta ambos algoritmos una vez, en orden
Dijkstra → Bellman-Ford, con la misma entrada:

```json
{"origen": "ID_OSM_ORIGEN", "destino": "ID_OSM_DESTINO", "minuto_dia": 480}
```

Devuelve `resultados` con ambas rutas, `costos_equivalentes` (tolerancia
relativa 1e-9 y absoluta 1e-6 m), `diferencia_costo_m` y
`razon_tiempo_bf_sobre_dijkstra`. Una razón mayor a 1 indica mayor tiempo
de Bellman-Ford en esa medición. Si el tiempo de Dijkstra es cero, la razón
es null. En empates pueden aparecer secuencias o distancias físicas distintas
con el mismo costo ponderado óptimo. Si no existe ruta, devuelve 404.

Ahora cada ruta incluye `tiempo_algoritmo_ms`, que mide solo la invocación
del algoritmo (incluida la preparación de sus pesos y reconstrucción de arcos).
`tiempo_ms` mantiene la medición total del caso de uso. Son muestras individuales,
no un benchmark estadístico ni una garantía de rendimiento; dependen de la
carga, orden de ejecución y del destino elegido.

En Bellman-Ford `nodos_evaluados` cuenta orígenes alcanzables cuyos arcos
se examinaron al menos una vez, más el destino; en Dijkstra cuenta extracciones
definitivas. No comparar este contador como si midiera operaciones equivalentes.
Las pruebas contrastan ambos motores con un oráculo Floyd-Warshall en grafos
pequeños con direcciones, desconexiones y diferentes horarios.

Siguiente etapa: múltiples entregas con Held-Karp y backtracking.
