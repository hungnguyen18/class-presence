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

const vuetify = createVuetify({
  components,
  directives,
})

createApp(App).use(vuetify).use(router).mount('#app')
