# RUTEA · Frontend, etapa 3

Aplicación académica de rutas en Miraflores y San Isidro. Vue 3 + TypeScript +
Vite en la raíz; FastAPI y datos OpenStreetMap en `backend/`.

La base utiliza PrimeVue 4, tema Aura personalizado, PrimeIcons y Pinia 3.
Las versiones resueltas están en `package-lock.json`. La pantalla permite cambiar
modalidad y minuto de salida. Consulta `/api/health` y `/api/grafo/resumen`
al abrirse, mostrando conteos y atribución reales. Después descarga la red vial
GeoJSON y todos los nodos paginados para dibujar el mapa con Leaflet 1.9.4.
Pinia mantiene la selección hasta recargar la página.

## Arquitectura

| Carpeta | Responsabilidad |
| --- | --- |
| `src/domain` | Modelos puros y contratos, sin Vue, HTTP ni Leaflet. |
| `src/application` | Casos de uso y stores Pinia. |
| `src/infrastructure` | Adaptadores HTTP y configuración de proveedores. |
| `src/presentation` | Componentes y vistas. |
| `src/shared` | Utilidades y estilos comunes. |

`main.ts` registra Pinia y PrimeVue. El tema está en
`src/infrastructure/config/theme.ts`. `App.vue` monta Dashboard; los componentes
PrimeVue se importan individualmente. Las carpetas de etapas siguientes tienen
README con su responsabilidad. Leaflet se carga de forma diferida con MapViewer.

## Backend y proxy local

Instalación y datos: ver `backend/README.md`. Desde la raíz, en otra terminal:

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --reload
```

El servidor Vite redirige `/api/*` a `http://127.0.0.1:8000`, preservando `/api`.
El proxy solo funciona durante desarrollo; el enrutamiento de producción está
pendiente de la etapa de despliegue. Sin FastAPI, muestra error y permite reintentar.

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

1. Calcular y dibujar rutas con los algoritmos del backend.
2. Capas MST/sectores y comparación de métricas.

## Mapa y selección

La red se dibuja sobre un fondo local sin teselas ni geocodificación externas.
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
La vista aún no invoca los endpoints POST de cálculo de rutas.

El mapa previsto no requiere teselas externas. CO₂ y experimentos reproducibles
siguen pendientes del backend.

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
