/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentRuns from "../agentRuns.js";
import type * as approvals from "../approvals.js";
import type * as auditLogs from "../auditLogs.js";
import type * as crons from "../crons.js";
import type * as demoSeed from "../demoSeed.js";
import type * as files from "../files.js";
import type * as invoices from "../invoices.js";
import type * as leases from "../leases.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentRuns: typeof agentRuns;
  approvals: typeof approvals;
  auditLogs: typeof auditLogs;
  crons: typeof crons;
  demoSeed: typeof demoSeed;
  files: typeof files;
  invoices: typeof invoices;
  leases: typeof leases;
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
