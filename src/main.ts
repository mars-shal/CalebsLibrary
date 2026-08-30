import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Analytics } from '@vercel/analytics/vue'
import './assets/main.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Analytics)

app.mount('#app')
