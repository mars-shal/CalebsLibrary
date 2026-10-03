// Caleb's Library — Sentry wiring.
//
// Thin wrapper so the rest of the app never imports @sentry/vue directly and
// never has to know whether monitoring is enabled. When VITE_SENTRY_DSN is
// absent (local dev, CI) every function here is a no-op, so call sites can be
// unconditional.
//
// The SDK is loaded with a dynamic import, not a static one. It is ~90 KB
// brotli — measured, and almost exactly what this file's import graph used to
// add to the main chunk. That blocked first paint for a tool that only matters
// once the app has already failed. Loading it after mount keeps it off the
// critical path; Vercel serves it as its own immutable chunk, so it costs
// nothing on repeat visits.
//
// Two consequences worth knowing:
//
// - Without a DSN the SDK is never imported at all, so it stays tree-shaken to
//   zero bytes. That is why the single dynamic import below is inside the
//   DSN guard and nowhere else — a second import at module scope would fetch
//   the chunk even when monitoring is disabled.
//
// - There is a real window between mount and the SDK resolving during which
//   errors occur. Rather than silently dropping them, early reports are queued
//   (bounded) and flushed once init completes.

import type { App } from 'vue'
import type { Router } from 'vue-router'
import type { PiniaPlugin, PiniaPluginContext } from 'pinia'

type SentryModule = typeof import('@sentry/vue')
type SentrySeverity = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

let sdk: SentryModule | null = null
let enabled = false
/** The real Pinia plugin, created by the SDK once it loads. */
let sentryPlugin: PiniaPlugin | null = null
/** Reports captured before the SDK finished loading. */
let pending: Array<[unknown, Record<string, unknown> | undefined]> = []

/** Cap the queue so a failure loop before load cannot grow unbounded. */
const MAX_PENDING = 20

export function initSentry(app: App, router: Router): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const isDev = import.meta.env.DEV

  // Fire and forget: nothing downstream waits on this.
  void import('@sentry/vue')
    .then((S) => {
      S.init({
        app,
        dsn,
        environment: isDev ? 'development' : 'production',
        release: import.meta.env.VITE_RELEASE ?? undefined,

        integrations: [
          // Pass the router so transactions get real route names instead of URLs.
          S.browserTracingIntegration({ router }),
          // Session Replay is a paid Sentry feature: if it is not enabled on the
          // project this integration resolves to a no-op rather than erroring.
          // Set VITE_SENTRY_REPLAY=false to drop the payload cost entirely.
          ...(import.meta.env.VITE_SENTRY_REPLAY === 'false'
            ? []
            : [S.replayIntegration()]),
        ],

        // 100% of transactions in dev for local debugging, a fifth in
        // production. The upstream snippet used 1.0 everywhere, which on a real
        // traffic day is a very large bill for data nobody reads.
        tracesSampleRate: isDev ? 1.0 : 0.2,

        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Only trace our own origins. localhost is useful in dev; the Convex
        // cloud URLs do not need distributed-trace propagation.
        tracePropagationTargets: [/^https:\/\/[^/]+\.convex\.(cloud|site)$/],

        beforeSend(event) {
          // Never ship a contributor email or a Drive file id to a third party.
          if (event.request?.url) {
            event.request.url = event.request.url.replace(
              /([?&]key=)[^&]+/g,
              '$1[redacted]',
            )
          }
          return event
        },
      })

      sdk = S
      sentryPlugin = S.createSentryPiniaPlugin() as PiniaPlugin
      enabled = true

      S.setTag('surface', 'web')
      S.setTag('convex', import.meta.env.VITE_CONVEX_URL ?? 'unset')

      // Flush anything that failed while the chunk was still in flight.
      const queued = pending
      pending = []
      for (const [err, context] of queued) {
        S.captureException(err, context ? { extra: context } : undefined)
      }
    })
    .catch((err) => {
      // Monitoring is not worth breaking the app over.
      console.error('[sentry] failed to load; error reporting disabled', err)
    })
}

/**
 * Pinia plugin that reports failed store actions. Register on the Pinia
 * instance: `createPinia().use(sentryPiniaPlugin)`.
 *
 * This delegates to the plugin the SDK creates on init, rather than being that
 * plugin directly — creating it required the SDK to be loaded, which is the
 * static import this module exists to avoid.
 */
export const sentryPiniaPlugin: PiniaPlugin = (context) =>
  sentryPlugin?.(context as PiniaPluginContext)

/**
 * Report a caught error. Deliberately used in the places that used to
 * `console.error` and move on — those were the errors nobody ever saw.
 */
export function captureAppException(
  err: unknown,
  context?: Record<string, unknown>,
): void {
  if (enabled && sdk) {
    sdk.captureException(err, context ? { extra: context } : undefined)
    return
  }
  if (import.meta.env.VITE_SENTRY_DSN && pending.length < MAX_PENDING) {
    // Will be flushed as soon as the SDK loads.
    pending.push([err, context])
    return
  }
  console.error('[unreported]', context ?? '', err)
}

export function captureAppMessage(
  message: string,
  level: SentrySeverity = 'warning',
  context?: Record<string, unknown>,
): void {
  if (enabled && sdk) {
    sdk.captureMessage(message, { level, extra: context })
    return
  }
  console.warn(`[unreported] ${message}`, context ?? '')
}