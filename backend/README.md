# RUTEA · Backend, etapa 4

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

## Múltiples entregas y algoritmos puros

Los motores residen en `app/domain/algorithm/`, sin FastAPI ni Pydantic:
`dijkstra.py`, `bellman_ford.py`, `ufds.py`, `trafico.py`, `tsp_dp.py`
(Held-Karp), `backtracking.py` (fuerza bruta con poda), `tsp.py` (contrato
de matriz/resultado) y `divide_conquer.py` (zonificación).
Los casos de uso en `app/application/services/` construyen la matriz, invocan
los motores y expanden la secuencia de visitas a calles reales.

`POST /api/rutas/multi-entrega`:

```json
{
  "origen": "ID_DEPOSITO",
  "destinos": ["ID_CLIENTE_1", "ID_CLIENTE_2"],
  "minuto_dia": 480,
  "algoritmo": "held_karp",
  "volver_origen": true
}
```

Held-Karp admite 1–12 clientes (O(N² 2^N)); `backtracking` admite 1–8
(O(N!) con poda por costo acumulado). Estas cotas son límites operativos
explícitos para evitar trabajo exponencial ilimitado. No repetir IDs ni
incluir el depósito entre clientes. `volver_origen` vale true por defecto;
false produce un recorrido abierto cuya última parada también se optimiza.

La matriz asimétrica se calcula con Dijkstra entre cada par de puntos,
manteniendo infinito en pares inaccesibles. Que un par sea inaccesible no
impide necesariamente una secuencia abierta válida. Se devuelve 404 solo
si no existe un recorrido completo con las condiciones solicitadas.
La preparación realiza como máximo (N+1)N búsquedas punto a punto y guarda
sus arcos exactos; no usa distancias en línea recta ni simetriza calles.
El tráfico se mantiene fijo en la hora seleccionada para todos los tramos.

La salida incluye `orden_visita` (paradas planificadas), `nodos` (recorrido
vial completo), geometría, distancia y costo. Un camino mínimo puede pasar
por otro cliente antes de su visita planificada o repetir calles; se permite
y no se imponen ventanas horarias ni restricciones de capacidad.
`estados_evaluados` cuenta estados DP almacenados o llamadas de búsqueda,
según el motor: no son medidas de trabajo idénticas.
`nodos_evaluados_matriz` suma las extracciones definitivas de las búsquedas
Dijkstra que sí encontraron camino; no incluye búsquedas fallidas.

`POST /api/rutas/multi-entrega/comparar` usa el mismo cuerpo, con máximo
8 clientes, y ejecuta ambos motores sobre una única matriz compartida.
El campo `algoritmo` no selecciona un motor en la comparación: siempre son ambos.
Devuelve ambas soluciones y equivalencia de costos; `tiempo_matriz_ms` separa
la preparación de `tiempo_algoritmo_ms` (solo secuenciación TSP).
En cada resultado, `tiempo_ms` suma la preparación compartida y resolución
de ese motor; `tiempo_total_ms` mide la comparación completa.
Pueden existir órdenes diferentes con el mismo costo óptimo.

`GET /api/grafo/sectores` devuelve los nodos de SO, SE, NO y NE. Divide por
el centro de la caja geográfica: primero latitud y después longitud; puntos
sobre los cortes se asignan al norte/este. Es O(V), no balancea cantidades
ni garantiza conectividad de cada sector. No elimina calles, restringe rutas
ni asigna automáticamente vehículos. La interfaz podrá visualizar estos grupos.

Siguiente etapa: Kruskal para la red troncal de distribución.
