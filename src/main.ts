import { createApp } from 'vue'
import App from './App.vue'
import 'normalize.css'
import 'vuetify/styles/main.css'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import './style.css'
import { router } from './router'

const STORAGE_KEY = 'class-presence-theme'
const savedTheme = localStorage.getItem(STORAGE_KEY) ?? 'scholarly'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: savedTheme,
    themes: {
      scholarly: {
        dark: false,
        colors: {
          background: '#F7F5F0',
          surface: '#FFFFFF',
          'surface-variant': '#F0EDE6',
          primary: '#2C3E50',
          'primary-darken-1': '#1A252F',
          secondary: '#D4A853',
          'secondary-darken-1': '#B8923E',
          accent: '#D4A853',
          success: '#3D8B5E',
          warning: '#D4953A',
          error: '#C0544F',
          info: '#4A7FA5',
          'on-background': '#2C3E50',
          'on-surface': '#2C3E50',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
        },
        variables: {
          'border-color': '#E0DCD4',
          'border-opacity': 0.6,
          'high-emphasis-opacity': 0.87,
          'medium-emphasis-opacity': 0.55,
          'disabled-opacity': 0.32,
        },
      },
      'scholarly-dark': {
        dark: true,
        colors: {
          background: '#13181F',
          surface: '#1B2230',
          'surface-variant': '#222B38',
          primary: '#7EB3D8',
          'primary-darken-1': '#1A252F',
          secondary: '#D4A853',
          'secondary-darken-1': '#B8923E',
          accent: '#D4A853',
          success: '#4DB87C',
          warning: '#E0A845',
          error: '#E06B66',
          info: '#5D9CC5',
          'on-background': '#D8D2C7',
          'on-surface': '#D8D2C7',
          'on-primary': '#13181F',
          'on-secondary': '#13181F',
        },
        variables: {
          'border-color': '#FFFFFF',
          'border-opacity': 0.09,
          'high-emphasis-opacity': 0.87,
          'medium-emphasis-opacity': 0.5,
          'disabled-opacity': 0.28,
        },
      },
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 0,
      border: true,
    },
    VBtn: {
      rounded: 'lg',
    },
    VTextField: {
      rounded: 'lg',
      variant: 'outlined',
    },
    VSelect: {
      rounded: 'lg',
      variant: 'outlined',
    },
    VChip: {
      rounded: 'lg',
    },
  },
})

createApp(App).use(vuetify).use(router).mount('#app')
