// Caleb's Library — root Convex app config.
//
// Declares the env vars Convex functions can read via
// `import { env } from "./convex/_generated/server"`.
//
// NOTE: variables declared here are set through `npx convex env set`, they are
// NEVER put in `.env*` files (Vite would leak them into the client bundle).
import { defineApp } from "convex/server";
import { v } from "convex/values";

export default defineApp({
  env: {
    // Google Drive API key — used only server-side for the Drive tree walk.
    // It is never persisted onto a catalogue row; `files.downloadUrl` mints
    // keyed URLs at request time.
    GOOGLE_DRIVE_API_KEY: v.string(),
    // Passphrase that unlocks the comment moderation queue.
    // Set with `npx convex env set ADMIN_PASSPHRASE <passphrase>`.
    ADMIN_PASSPHRASE: v.string(),
    // Upstash Redis REST credentials backing the read snapshot that the web
    // app reads from instead of querying Convex (convex/snapshot.ts).
    // Optional so the app still deploys before they are provisioned — the
    // snapshot functions degrade to no-ops and the Vercel function falls
    // through to Convex.
    //   npx convex env set UPSTASH_REDIS_REST_URL https://<db>.upstash.io
    //   npx convex env set UPSTASH_REDIS_REST_TOKEN <token>
    UPSTASH_REDIS_REST_URL: v.optional(v.string()),
    UPSTASH_REDIS_REST_TOKEN: v.optional(v.string()),
  },
});