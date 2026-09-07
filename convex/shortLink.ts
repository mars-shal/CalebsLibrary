// Caleb's Library — in-house short share links (Convex).
//
// Replaces the TinyURL api-create.php call with our own shortener so shared
// links are {origin}/s/{code} and never depend on a third party. Codes are
// derived deterministically from the paper id (FNV-1a → base62), so the same
// paper always reuses the same short link instead of minting a new one per
// share. The client-side /s/:code route resolves them via getByCode.
import { z } from "zod";
import { zCustomQuery, zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { query, mutation } from "./_generated/server";

const CODE_CHARS =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_LENGTH = 7;

// FNV-1a hash of the seed → fixed-length base62 string. Deterministic per
// paper id, so re-sharing the same paper yields the same short code.
function codeFromSeed(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  let value = hash >>> 0;
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[value % CODE_CHARS.length];
    value = Math.floor(value / CODE_CHARS.length);
  }
  return code;
}

// Resolve a short code to its destination URL (used by the /s/:code page).
export const getByCode = zCustomQuery(query, NoOp)({
  args: { code: z.string() },
  returns: z.object({ url: z.string(), paper_id: z.string() }).nullable(),
  handler: async (ctx, { code }) => {
    const link = await ctx.db
      .query("shortLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    return link ? { url: link.url, paper_id: link.paper_id } : null;
  },
});

// Create (or reuse) a short link for a paper. Idempotent per paper_id.
export const create = zCustomMutation(mutation, NoOp)({
  args: { paper_id: z.string(), url: z.string() },
  returns: z.object({ code: z.string() }),
  handler: async (ctx, { paper_id, url }) => {
    const existing = await ctx.db
      .query("shortLinks")
      .withIndex("by_paper_id", (q) => q.eq("paper_id", paper_id))
      .first();
    if (existing) return { code: existing.code };

    let code = codeFromSeed(paper_id);
    let attempt = 0;
    while (
      await ctx.db
        .query("shortLinks")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first()
    ) {
      // Astronomically rare hash clash — re-seed and retry a few times.
      code = codeFromSeed(`${paper_id}:${attempt}`);
      attempt++;
      if (attempt > 8) throw new Error("Could not mint a unique short code");
    }
    await ctx.db.insert("shortLinks", {
      code,
      paper_id,
      url,
      created_at: Date.now(),
      clicks: 0,
    });
    return { code };
  },
});

// Count a redirect hit (fire-and-forget from the /s/:code page).
export const bumpClicks = zCustomMutation(mutation, NoOp)({
  args: { code: z.string() },
  returns: z.object({ ok: z.boolean() }),
  handler: async (ctx, { code }) => {
    const link = await ctx.db
      .query("shortLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (link) await ctx.db.patch(link._id, { clicks: link.clicks + 1 });
    return { ok: true };
  },
});