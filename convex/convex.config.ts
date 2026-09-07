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
    // Google Drive API key — used only server-side to bake download URLs.
    GOOGLE_DRIVE_API_KEY: v.string(),
    // Passphrase that unlocks the comment moderation queue.
    // Set with `npx convex env set ADMIN_PASSPHRASE <passphrase>`.
    ADMIN_PASSPHRASE: v.string(),
  },
});