import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const actorType = v.union(v.literal("user"), v.literal("agent"), v.literal("system"));

export const writeAuditLog = mutation({
  args: {
    orgId: v.id("orgs"),
    actorType,
    actorId: v.optional(v.string()),
    agentRunId: v.optional(v.id("agentRuns")),
    action: v.string(),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    summary: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listAuditLogsForTarget = query({
  args: {
    orgId: v.id("orgs"),
    targetTable: v.string(),
    targetId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_orgId_and_targetTable_and_targetId", (q) =>
        q
          .eq("orgId", args.orgId)
          .eq("targetTable", args.targetTable)
          .eq("targetId", args.targetId),
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});
