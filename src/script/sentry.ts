// Bells Notes — Sentry wiring.
//
// Thin wrapper so the rest of the app never imports @sentry/vue directly and
// never has to know whether monitoring is enabled. When VITE_SENTRY_DSN is
// absent (local dev, CI) every function here is a no-op, so call sites can be
// unconditional.

import * as Sentry from '@sentry/vue'
import type { App } from 'vue'
import type { Router } from 'vue-router'

let enabled = false

export function initSentry(app: App, router: Router): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const isDev = import.meta.env.DEV

  Sentry.init({
    app,
    dsn,
    environment: isDev ? 'development' : 'production',
    release: import.meta.env.VITE_RELEASE ?? undefined,

    integrations: [
      // Pass the router so transactions get real route names instead of URLs.
      Sentry.browserTracingIntegration({ router }),
      // Session Replay is a paid Sentry feature: if it is not enabled on the
      // project this integration resolves to a no-op rather than erroring.
      // Set VITE_SENTRY_REPLAY=false to drop the payload cost entirely.
      ...(import.meta.env.VITE_SENTRY_REPLAY === 'false'
        ? []
        : [Sentry.replayIntegration()]),
    ],

    // 100% of transactions in dev for local debugging, a fifth in production.
    // The upstream snippet used 1.0 everywhere, which on a real traffic day is
    // a very large bill for data nobody reads.
    tracesSampleRate: isDev ? 1.0 : 0.2,

    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Only trace our own origins. localhost is useful in dev; the Convex cloud
    // URLs do not need distributed-trace propagation.
    tracePropagationTargets: [/^https:\/\/[^/]+\.convex\.(cloud|site)$/],

    beforeSend(event) {
      // Never ship a contributor email or a Drive file id to a third party.
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/([?&]key=)[^&]+/g, '$1[redacted]')
      }
      return event
    },
  })

  enabled = true

  Sentry.setTag('surface', 'web')
  Sentry.setTag('convex', import.meta.env.VITE_CONVEX_URL ?? 'unset')
}

/**
 * Pinia plugin that reports failed store actions. Register on the Pinia
 * instance: `createPinia().use(sentryPiniaPlugin())`.
 *
 * Exposed here rather than configured in initSentry because it is a Pinia
 * plugin, not Sentry client config — but it lives in this module so there is
 * still exactly one file in the app that knows Sentry exists.
 */
export const sentryPiniaPlugin = Sentry.createSentryPiniaPlugin()

/**
 * Report a caught error. Deliberately used in the places that used to
 * `console.error` and move on — those were the errors nobody ever saw.
 */
export function captureAppException(err: unknown, context?: Record<string, unknown>): void {
  if (!enabled) {
    console.error('[unreported]', context ?? '', err)
    return
  }
  Sentry.captureException(err, context ? { extra: context } : undefined)
}

export function captureAppMessage(
  message: string,
  level: Sentry.SeverityLevel = 'warning',
  context?: Record<string, unknown>,
): void {
  if (!enabled) {
    console.warn(`[unreported] ${message}`, context ?? '')
    return
  }
  Sentry.captureMessage(message, { level, extra: context })
}
