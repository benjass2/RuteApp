# RUTEA

Plataforma académica de optimización de rutas urbanas en Miraflores y San Isidro.
Monorepo Vue 3 + TypeScript + FastAPI, con dataset OpenStreetMap local.

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

## Desarrollo local

Desde la raíz del repositorio:

```sh
npm ci
npm run dev
```

En otra terminal, iniciar FastAPI:

```powershell
.\.venv\Scripts\python -m uvicorn backend.main:app --reload
```

Vite conserva el proxy `/api` a `http://127.0.0.1:8000`. Los comandos npm de la
raíz delegan en el workspace `frontend`; también pueden ejecutarse desde esa carpeta.

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

## Documentación

- [Frontend y funcionalidades](frontend/README.md)
- [Bounded context y shared](frontend/src/README.md)
- [Backend, instalación y API](backend/README.md)
- [Preparación del despliegue](docs/DESPLIEGUE.md)

El motor y las capas del grafo funcionan con datos locales. El fondo de calles
OpenStreetMap necesita Internet; «Solo grafo» permite ver la red sin teselas externas. CO₂ y experimentos
reproducibles siguen pendientes. Vercel está configurado, pero todavía requiere
validación de empaquetado y rewrites en una build/preview de la plataforma.
