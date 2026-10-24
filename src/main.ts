import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { ruteaTheme } from '@/infrastructure/config/theme'
import 'primeicons/primeicons.css'
import '@/shared/assets/styles/main.css'
import { ruteaRepositoryKey } from '@/application/ports/dependencies'
import { ruteaRepository } from '@/infrastructure/config/dependencies'

createApp(App)
  .provide(ruteaRepositoryKey, ruteaRepository)
  .use(createPinia())
  .use(PrimeVue, {
    theme: { preset: ruteaTheme, options: { darkModeSelector: false } },
    locale: { emptyMessage: 'Sin resultados', emptySelectionMessage: 'Sin selección' },
  })
  .mount('#app')
