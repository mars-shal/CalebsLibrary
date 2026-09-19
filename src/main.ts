import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Analytics } from '@vercel/analytics/vue'
import './assets/main.css'
import App from './App.vue'
import router from './router'
import { convexVue } from 'convex-vue'

// Global error capture: surface failures in console with context, keep the
// app alive. (Sentry for web is a follow-up once the DSN is provisioned.)
const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
  console.error('[app error]', info, err)
}
app.config.warnHandler = (msg, instance, trace) => {
  console.warn('[app warn]', msg, trace)
}
window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandled rejection]', e.reason)
})

app.use(createPinia())
app.use(router)
app.use(Analytics)
app.use(convexVue, {
  url: import.meta.env.VITE_CONVEX_URL,
})

app.mount('#app')
