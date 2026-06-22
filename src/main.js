import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n/index.js'
import App from './App.vue'
import './styles/main.css'

createApp(App)
  .use(createPinia())
  .use(i18n)
  .mount('#app')
