/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string
  // Public Sentry DSN — safe in the client bundle (it is a write-only ingest
  // key). The Upstash token is NOT here: that one is a Convex env var and a
  // Vercel server-side var, never a VITE_ var.
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_REPLAY?: string
  readonly VITE_RELEASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
