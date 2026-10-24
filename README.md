# RUTEA · Frontend, etapa 1

Aplicación académica de rutas en Miraflores y San Isidro. Vue 3 + TypeScript +
Vite en la raíz; FastAPI y datos OpenStreetMap en `backend/`.

La base utiliza PrimeVue 4, tema Aura personalizado, PrimeIcons y Pinia 3.
Las versiones resueltas están en `package-lock.json`. La pantalla permite cambiar
modalidad y minuto de salida. Todavía no dibuja el mapa ni consulta FastAPI.
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
README con su responsabilidad. Leaflet se instalará en la etapa del mapa.

## Backend y proxy local

Instalación y datos: ver `backend/README.md`. Desde la raíz, en otra terminal:

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --reload
```

El servidor Vite redirige `/api/*` a `http://127.0.0.1:8000`, preservando `/api`.
El proxy solo funciona durante desarrollo; el enrutamiento de producción está
pendiente de la etapa de despliegue. La pantalla base funciona sin FastAPI.

## Próximos pasos

1. Contratos tipados, cliente Fetch y conexión con FastAPI.
2. Mapa Leaflet con GeoJSON local y selección de intersecciones.
3. Rutas, entregas, capas MST/sectores y métricas.

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
