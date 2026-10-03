import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.css'
import App from './App.vue'
import router from './router'
import { initSentry, sentryPiniaPlugin } from './script/sentry'

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

// Must run before mount so the Vue error handler and router instrumentation are
// installed on the app instance. Sentry.init is a no-op without a DSN.
initSentry(app, router)

const pinia = createPinia()
// Wraps every store action in a span and reports the ones that throw — the
// store was previously swallowing these in bare catch blocks.
pinia.use(sentryPiniaPlugin)

app.use(pinia)
app.use(router)

app.mount('#app')
