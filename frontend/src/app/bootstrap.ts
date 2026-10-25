import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './presentation/App.vue'
import { ruteaTheme } from '@/shared/presentation/theme/ruteaTheme'
import { ruteaRepositoryKey } from '@/planificacion-rutas/application/ports/dependencies'
import { ruteaRepository } from './infrastructure/dependencies'
import 'primeicons/primeicons.css'
import '@/shared/presentation/styles/main.css'

/** Composition root: aquí se conectan proveedores, contratos y plugins. */
export function crearAplicacion() {
  return createApp(App)
    .provide(ruteaRepositoryKey, ruteaRepository)
    .use(createPinia())
    .use(PrimeVue, {
      theme: { preset: ruteaTheme, options: { darkModeSelector: false } },
      locale: { emptyMessage: 'Sin resultados', emptySelectionMessage: 'Sin selección' },
    })
}
