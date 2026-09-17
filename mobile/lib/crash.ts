// Crash reporting — Sentry scaffold (Phase 7a).
// Dormant until EXPO_PUBLIC_SENTRY_DSN is set (EAS secret, never committed).
// LAZY-LOADED: @sentry/react-native is a native module absent from Expo Go —
// a static import would red-screen previews the same way MMKV did. Both
// entry points guard natively, so this file is safe to import anywhere.
let started = false;

function sentry(): {
  init: (opts: { dsn: string; tracesSampleRate: number }) => void;
  captureException: (e: unknown) => void;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sentry/react-native') as {
      init: (opts: { dsn: string; tracesSampleRate: number }) => void;
      captureException: (e: unknown) => void;
    };
  } catch {
    return null;
  }
}

export function initCrashReporting(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || started) return;
  try {
    sentry()?.init({ dsn, tracesSampleRate: 0.1 });
    started = true;
  } catch {
    // never break boot for telemetry
  }
}

export function captureError(e: unknown): void {
  if (!started) return;
  try {
    sentry()?.captureException(e);
  } catch {
    // ignore
  }
}
