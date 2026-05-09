import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const agentName = v.union(
  v.literal("MaintenanceAgent"),
  v.literal("ContractAgent"),
  v.literal("InvoiceAgent"),
  v.literal("CommsAgent"),
  v.literal("OrchestratorAgent"),
);

const eventSource = v.union(
  v.literal("dashboard"),
  v.literal("whatsapp"),
  v.literal("email"),
  v.literal("cron"),
  v.literal("upload"),
);

export const startAgentRun = mutation({
  args: {
    orgId: v.id("orgs"),
    agentName,
    eventId: v.string(),
    source: eventSource,
    inputSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("agentRuns", {
      ...args,
      status: "running",
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const completeAgentRun = mutation({
  args: {
    agentRunId: v.id("agentRuns"),
    outputSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.agentRunId, {
      status: "completed",
      outputSummary: args.outputSummary,
      completedAt: now,
      updatedAt: now,
    });

    return args.agentRunId;
  },
});

export const failAgentRun = mutation({
  args: {
    agentRunId: v.id("agentRuns"),
    error: v.string(),
    outputSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.agentRunId, {
      status: "failed",
      error: args.error,
      outputSummary: args.outputSummary,
      completedAt: now,
      updatedAt: now,
    });

    return args.agentRunId;
  },
});

export const listAgentRuns = query({
  args: {
    orgId: v.id("orgs"),
    agentName: v.optional(agentName),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.agentName !== undefined) {
      return await ctx.db
        .query("agentRuns")
        .withIndex("by_orgId_and_agentName", (q) =>
          q.eq("orgId", args.orgId).eq("agentName", args.agentName!),
        )
        .order("desc")
        .take(args.limit ?? 50);
    }

    return await ctx.db
      .query("agentRuns")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});
