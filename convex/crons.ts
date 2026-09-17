// Caleb's Library — scheduled jobs.
//
// v2: the catalogue syncs via DIFF (insert/patch/delete by drive id) every
// 12 hours — never the old wipe+reinsert every 10 minutes (that pattern
// caused the Convex ban: ~288k writes/day for static data).
// Search-term rows whose recency score has decayed are swept out daily
// (convex/trends.ts) so the searchTrends table stays small.
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync-catalogue-diff",
  { hours: 12 },
  internal.catalogue.syncDiffFromDrive,
);

crons.daily(
  "prune-decayed-search-trends",
  { hourUTC: 4, minuteUTC: 0 },
  internal.trends.pruneStale,
);

export default crons;
