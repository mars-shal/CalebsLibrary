// Caleb's Library — optional profiles, no passwords (Convex).
// Identity is a profile row keyed by normalized email: sign-up collects
// name + email (+ department/program + level via onboarding scope), sign-in
// is the same upsert (no secrets, no verification in v1 — convenience
// identity for personalization, NOT authentication). Guests skip entirely
// (null profile, device-scoped data only). Email is private, never rendered.
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

// Create-or-refresh a profile. Returns the profile id for the session.
export const upsert = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    program: v.string(),
    level: v.string(),
    college: v.optional(v.string()),
    deviceHash: v.optional(v.string()),
  },
  returns: v.object({ id: v.id("users") }),
  handler: async (ctx, a) => {
    const email = normalizeEmail(a.email);
    if (!validEmail(email)) throw new Error("Enter a valid email address.");
    const name = a.name.trim().slice(0, 80);
    if (!name) throw new Error("Enter your name.");
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name,
        program: a.program,
        level: a.level,
        college: a.college,
        deviceHash: a.deviceHash,
        updatedAt: Date.now(),
      });
      return { id: existing._id };
    }
    const id = await ctx.db.insert("users", {
      email,
      name,
      program: a.program,
      level: a.level,
      college: a.college,
      deviceHash: a.deviceHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { id };
  },
});

// Fetch a profile for session hydration.
export const get = query({
  args: { id: v.id("users") },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.string(),
      program: v.string(),
      level: v.string(),
      college: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, a) => {
    const u = await ctx.db.get(a.id);
    if (!u) return null;
    return {
      _id: u._id,
      email: u.email,
      name: u.name,
      program: u.program,
      level: u.level,
      college: u.college,
    };
  },
});

// Look up a profile by email for sign-in. Returns null when unknown —
// the client then offers the create-account screen instead of an error wall.
export const byEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.string(),
      program: v.string(),
      level: v.string(),
      college: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, a) => {
    const email = a.email.trim().toLowerCase();
    if (!email) return null;
    const u = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!u) return null;
    return {
      _id: u._id,
      email: u.email,
      name: u.name,
      program: u.program,
      level: u.level,
      college: u.college,
    };
  },
});
