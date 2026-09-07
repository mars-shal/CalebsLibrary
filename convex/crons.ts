// Caleb's Library — scheduled catalogue syncs + trend pruning.
//
// Refreshes the catalogue from the Google Drive tree roughly every 10 minutes.
// The sync action lives in convex/catalogue.ts and is internal-only, so the
// only way it runs is through this cron (or a manual dashboard trigger).
// Search-term rows whose recency score has fully decayed are swept out daily
// (convex/trends.ts) so the searchTrends table stays small.
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sync-catalogue-from-drive",
  { minutes: 10 },
  internal.catalogue.syncFromDrive,
);

crons.daily(
  "prune-decayed-search-trends",
  { hourUTC: 4, minuteUTC: 0 },
  internal.trends.pruneStale,
);

export default crons;