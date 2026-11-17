import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const ruteaTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}', 100: '{emerald.100}', 200: '{emerald.200}',
      300: '{emerald.300}', 400: '{emerald.400}', 500: '{emerald.500}',
      600: '{emerald.600}', 700: '{emerald.700}', 800: '{emerald.800}',
      900: '{emerald.900}', 950: '{emerald.950}',
      color: '#087452',
      contrastColor: '#fff',
      hoverColor: '#066146',
      activeColor: '#054a37',
    },
    focusRing: { width: '2px', color: '#07553e', offset: '3px' },
  },
  components: {
    button: {
      root: {
        secondary: {
          background: '#edf4f0',
          borderColor: '#829b8d',
          color: '#234239',
          hoverBackground: '#dcebe3',
          hoverBorderColor: '#5a7b6c',
          hoverColor: '#17382e',
          activeBackground: '#cce0d4',
          activeBorderColor: '#5a7b6c',
          activeColor: '#17382e',
          focusRing: { color: '#07553e' },
        },
      },
      outlined: { primary: { borderColor: '#678b7b' } },
      text: { secondary: { color: '#40584f' } },
    },
  },
})
