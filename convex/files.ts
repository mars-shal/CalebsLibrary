// Caleb's Library — request-time download URLs (Convex action).
//
// Interim fix for the baked `?key=APIKEY` leak: download URLs are minted
// server-side at request time (key never persisted in rows) instead of
// stored per catalogue row. A future pass should proxy bytes through an
// httpAction so the key never reaches the client at all.
import { action, env } from "./_generated/server";
import { v } from "convex/values";

const DRIVE_API = "https://www.googleapis.com/drive/v3";

export const downloadUrl = action({
  args: { fileId: v.string() },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, { fileId }) => {
    if (fileId.startsWith("sub_")) {
      throw new Error(
        "Community upload — resolve via the submissions.getFile query.",
      );
    }
    const key = env.GOOGLE_DRIVE_API_KEY;
    if (!key) throw new Error("Downloads unavailable.");
    return { url: `${DRIVE_API}/files/${fileId}?alt=media&key=${key}` };
  },
});
