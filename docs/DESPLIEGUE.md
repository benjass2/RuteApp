# Preparación para Vercel

La configuración está preparada para un proyecto Vite con una función Python
en `api/index.py`. La lógica permanece en `backend/`. La documentación de
[funciones Python en /api](https://vercel.com/docs/functions/runtimes/python/api-directory)
describe este modo; Vercel también ofrece Services para una arquitectura nueva
con servicios separados. Este proyecto conserva la distribución existente.

## Archivos y rutas

- `vercel.json`: preset Vite explícito, instalación `npm ci`, build `npm run build`,
  salida `frontend/dist` y función `api/index.py`. Los comandos npm de la raíz
  delegan en el workspace `frontend` y usan un único lockfile.
- `requirements.txt`: reutiliza `backend/requirements.txt`, sin OSMnx ni librerías GIS.
- `.python-version`: Python 3.13.
- `api/index.py`: exporta la app ASGI y carga el grafo una vez al inicializar
  cada proceso. No depende de que el adaptador llame a lifespan, y no vuelve
  a cargar el JSON si después se ejecuta lifespan.
- `includeFiles`: incluye código Python y `backend/dataset/dataset_grafo.json`.
  También incluye `backend/dataset/dataset_sur.json` para la zona sur.
- `.vercelignore` y `excludeFiles`: excluyen caché, entorno virtual, herramientas
  de descarga y pruebas. El dataset procesado sí se incluye.

Las llamadas del navegador continúan usando `/api`, con el mismo origen:

| URL pública | Destino previsto |
| --- | --- |
| `/api/*` | Función Python, conservando la ruta HTTP original para FastAPI |
| `/docs`, `/docs/*`, `/redoc`, `/openapi.json` | Documentación de FastAPI |
| `/assets/*` | Artefactos estáticos de Vite |
| Rutas del frontend | `frontend/dist/index.html` |

Las rutas API inexistentes deben devolver 404 JSON, nunca el HTML de la SPA.
Los patrones de producción no cambian el proxy de desarrollo de Vite.
La configuración no usa `builds` legacy ni se combina con el preset FastAPI.

## Comprobaciones locales

Ejecutar desde la raíz con las dependencias de desarrollo instaladas:

```powershell
npm run test:frontend
npm run build
.\.venv\Scripts\python -m unittest discover -s backend/tests -v
.\.venv\Scripts\python backend/scripts/verificar_despliegue.py
```

El verificador comprueba la build, la entrada ASGI sin lifespan, el dataset real,
el cálculo comparativo, los endpoints principales y el tamaño de sus respuestas.
No ejecuta el empaquetador ni el router de Vercel: una comprobación local no
equivale a una build o una publicación de la plataforma.

## Configuración al importar el repositorio

1. Usar la raíz del repositorio como Root Directory, no `backend/`, `frontend/` ni `frontend/src/`.
2. Mantener el Framework Preset en **Vite**, como indica `vercel.json`.
3. Conservar los comandos y output directory del archivo de configuración.
4. Verificar que el commit incluya el JSON procesado, `api/`, los archivos de
   configuración y los archivos fuente nuevos; los archivos locales sin commit
   no llegan a una importación Git.
5. No definir `RUTEA_DATASET_PATH` con una ruta absoluta de Windows. El valor por
   defecto se resuelve respecto al archivo `backend/main.py` empaquetado.

No se necesita una base de datos, una clave de mapas ni una descarga OSM en el
arranque. Cada instancia serverless tendrá su copia de solo lectura en memoria.
La duración configurada es de 30 segundos; el cliente conserva su timeout de
15 segundos. Una cancelación del navegador no garantiza interrumpir el trabajo
Python en la instancia. 

## Validación pendiente en un preview

Tras crear un preview de Vercel, comprobar `/`, `/api/health` (dataset disponible),
`/api/grafo/resumen`, `/docs`, las páginas de nodos y los cálculos de ambos modos.
Verificar también `/api/ruta-inexistente` → 404 JSON, la carga de assets al
refrescar una ruta del frontend y que el bundle contenga el JSON sin caché OSMnx.
La build y el preview requieren acceso al proyecto/cuenta; esta preparación
no inicia una publicación ni crea recursos en Vercel.

Los [límites de funciones](https://vercel.com/docs/functions/limitations) incluyen
un máximo de 4.5 MB por respuesta. El verificador usa 4 500 000 bytes como umbral
conservador; si crece el dataset habrá que paginar o servir la red por otro mecanismo.
La configuración de inclusión y duración está documentada en
[vercel.json](https://vercel.com/docs/project-configuration/vercel-json).
