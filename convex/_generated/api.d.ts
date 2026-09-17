/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as catalogue from "../catalogue.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as driveSync from "../driveSync.js";
import type * as files from "../files.js";
import type * as metrics from "../metrics.js";
import type * as reports from "../reports.js";
import type * as shortLink from "../shortLink.js";
import type * as submissions from "../submissions.js";
import type * as trends from "../trends.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  catalogue: typeof catalogue;
  comments: typeof comments;
  crons: typeof crons;
  driveSync: typeof driveSync;
  files: typeof files;
  metrics: typeof metrics;
  reports: typeof reports;
  shortLink: typeof shortLink;
  submissions: typeof submissions;
  trends: typeof trends;
  users: typeof users;
  votes: typeof votes;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
