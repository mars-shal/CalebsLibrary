// Caleb's Library — Convex client (browser).
// A single shared ConvexClient + typed API reference for the whole app.
// The client talks to Convex instead of walking Google Drive directly, so the
// browser never needs the Drive API key.
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL as string);

export { api };
export type { CatalogueItem } from "@/schema/catalogue";

export type CommentItem = FunctionReturnType<typeof api.comments.list>[number];