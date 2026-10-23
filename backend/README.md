# RUTEA · Backend, etapa 1

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

Siguiente etapa: UFDS, pesos de tráfico simulado y caminos mínimos.
OpenStreetMap proporciona red vial, no tráfico horario en tiempo real.
