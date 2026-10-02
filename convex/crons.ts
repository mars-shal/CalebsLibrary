// Bells Notes — scheduled catalogue syncs + trend pruning + snapshot repair.
//
// v2: the catalogue syncs via DIFF (insert/patch/delete by drive id), never the
// old wipe+reinsert every 10 minutes — that pattern caused the Convex ban
// (~288k writes/day for static data). The interval was then relaxed from 12h to
// 3 days, because the sync action now skips the diff entirely when the Drive
// tree is unchanged (see the fingerprint gate in convex/catalogue.ts).
// Search-term rows whose recency score has fully decayed are swept out daily
// (convex/trends.ts) so the searchTrends table stays small.
//
// NOTE: only `crons.interval` / `crons.cron` are used — the `hourly`/`daily`/
// `weekly` helpers are not part of the supported cron API (see
// convex/_generated/ai/guidelines.md).
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 3 days (72h — `crons.interval` accepts seconds/minutes/hours only, not
// days): full Drive tree walk -> fingerprint -> diff -> applyDiff.
//
// The walk always runs (Drive offers no cheap change signal for a folder tree),
// but `syncDiffFromDrive` compares the tree's fingerprint against the last one
// applied and returns immediately when nothing changed — so an idle period
// costs one enumeration and zero database work. When Drive *has* changed, only
// the delta is written.
crons.interval(
  "sync-catalogue-from-drive",
  { hours: 72 },
  internal.catalogue.syncDiffFromDrive,
);

// Daily at 04:00 UTC: drop search-term rows whose recency score has decayed.
crons.cron(
  "prune-decayed-search-trends",
  "0 4 * * *",
  internal.trends.pruneStale,
);

// Daily at 05:00 UTC: rebuild the Upstash read snapshot from Convex and repair
// it on drift. This also keeps the Redis database active — Upstash archives
// free-tier databases after 30 days of inactivity, so a snapshot that is only
// ever written on a 3-day Drive sync would sit dangerously close to that line.
crons.cron(
  "verify-read-snapshot",
  "0 5 * * *",
  internal.snapshot.verify,
);

export default crons;
