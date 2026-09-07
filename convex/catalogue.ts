// Caleb's Library — Convex catalogue API.
//
// Public surface:
//  - get            → read the whole synced catalogue (frontend)
// Internal surface (cron / other Convex functions only):
//  - replaceAll     → wipe + re-insert the catalogue in one transaction
//  - syncFromDrive  → action: walk Google Drive and replace the catalogue
//
// Every function validates its inputs/outputs against the shared Zod schema
// (src/schema/catalogue.ts) through convex-helpers' zod4 bindings. The return
// validator is auto-converted to a Convex validator (zodOutputToConvex), so the
// Convex runtime enforces the shape in addition to TypeScript.
import { zCustomQuery, zCustomMutation, zCustomAction } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, internalMutation, internalAction, env } from "./_generated/server";
import { internal } from "./_generated/api";
import { catalogueItemSchema, syncResultSchema } from "../src/schema/catalogue";
import { walkCatalogueTree } from "./driveSync";

// Read the full synced catalogue. The frontend loads this once and derives
// courses/subjects/search locally — no per-request Drive calls.
export const get = zCustomQuery(query, NoOp)({
  args: {},
  returns: catalogueItemSchema.array(),
  handler: async (ctx) => {
    return await ctx.db.query("catalogue").collect();
  },
});

// Internal mutation — wipes and re-inserts the catalogue in one transaction.
// Not exposed to clients; only called by the sync action.
export const replaceAll = zCustomMutation(internalMutation, NoOp)({
  args: { items: catalogueItemSchema.array() },
  returns: syncResultSchema,
  handler: async (ctx, { items }) => {
    const existing = await ctx.db.query("catalogue").collect();
    await Promise.all(existing.map((doc) => ctx.db.delete(doc._id)));
    for (const item of items) {
      await ctx.db.insert("catalogue", item);
    }
    return { count: items.length, syncedAt: Date.now() };
  },
});

// Internal action — walks Google Drive and replaces the catalogue.
// Scheduled by the cron job; not reachable from the client.
// The Drive API key is read from the Convex env (set via `npx convex env set`),
// never from a client-provided value.
export const syncFromDrive = zCustomAction(internalAction, NoOp)({
  args: {},
  returns: syncResultSchema,
  handler: async (ctx) => {
    const items = await walkCatalogueTree(env.GOOGLE_DRIVE_API_KEY);
    await ctx.runMutation(internal.catalogue.replaceAll, { items });
    return { count: items.length, syncedAt: Date.now() };
  },
});