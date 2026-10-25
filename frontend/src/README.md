# Organización del frontend

```text
src/
├── main.ts
├── app/
│   ├── bootstrap.ts
│   ├── infrastructure/dependencies.ts
│   └── presentation/App.vue
├── planificacion-rutas/
│   ├── domain/
│   │   ├── models/
│   │   └── repositories/
│   ├── application/
│   │   ├── ports/
│   │   ├── stores/
│   │   └── use-cases/
│   ├── infrastructure/api/
│   └── presentation/
│       ├── components/
│       ├── constants/
│       ├── styles/
│       └── views/
└── shared/
    ├── domain/utils/
    ├── infrastructure/http/
    └── presentation/
        ├── styles/
        └── theme/
```

## Bounded context: planificacion-rutas

Su lenguaje incluye grafo vial, intersección, depósito, entrega, recorrido,
tráfico horario simulado y algoritmos de optimización. Grafo y análisis son
capacidades del mismo contexto: no se separan artificialmente en contextos
distintos mientras compartan estas reglas y flujos.

- **domain**: modelos y contratos independientes de Vue, Pinia, HTTP y Leaflet.
- **application**: casos de uso, stores e interfaces de inyección de proveedores.
- **infrastructure**: DTOs, validadores y adaptador HTTP específicos de FastAPI/RUTEA.
- **presentation**: vistas, componentes, colores de sectores y estilos del dashboard.

## App: raíz de composición

`main.ts` solo inicia la aplicación. `app/bootstrap.ts` registra plugins e
inyecciones. `app/infrastructure/dependencies.ts` construye el repositorio HTTP
con el transporte compartido. `app/presentation/App.vue` monta la vista inicial.
Esta capa de ensamblado puede conocer los adaptadores concretos; el contexto
no importa `app/`.

## Shared: piezas reutilizables

- **domain/utils**: formato de hora, puro y sin frameworks.
- **infrastructure/http**: Fetch, JSON, timeout, cancelación y errores genéricos;
  no conoce endpoints de rutas, DTOs RUTEA ni entidades del contexto.
- **presentation/theme**: tema global PrimeVue y colores de marca.
- **presentation/styles**: reset y estilos tipográficos comunes.

No se crean carpetas vacías `shared/application` o `shared/presentation/components`
para simular simetría. Se añadirán cuando exista un caso de uso o componente
realmente común. Los colores de sectores dependen de `SectorId`, por eso
pertenecen a la presentación del contexto y no a shared.

## Dirección de dependencias

La presentación usa la aplicación; la aplicación usa contratos del dominio.
Los adaptadores de infraestructura implementan dichos contratos. `app` conecta
todo. `shared` puede usar sus propias capas y librerías, pero no depende de
`planificacion-rutas` ni de `app`. Un contexto nuevo será una carpeta hermana
con su propio dominio; no se creará solo para agrupar componentes visuales.

Las pruebas de arquitectura inspeccionan imports estáticos, reexports e imports
dinámicos en TypeScript y scripts Vue para verificar estos límites.
Ejecutar `npm run test:frontend` y `npm run build` tras reorganizar módulos.
