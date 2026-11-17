import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import { ruteaTheme } from './ruteaTheme'
import { ruteaRepositoryKey } from '@/app/planificacion-rutas/application/ports/dependencies'
import { ruteaRepository } from './dependencies'
import 'primeicons/primeicons.css'

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
