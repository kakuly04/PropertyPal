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

export const enqueueAgentTask = mutation({
  args: {
    orgId: v.id("orgs"),
    assignedAgent: agentName,
    eventId: v.string(),
    source: eventSource,
    type: v.string(),
    propertyId: v.optional(v.id("properties")),
    taskId: v.optional(v.id("tasks")),
    fileId: v.optional(v.id("files")),
    approvalId: v.optional(v.id("approvals")),
    payload: v.optional(v.any()),
    runAfter: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const agentTaskId = await ctx.db.insert("agentTasks", {
      ...args,
      status: "queued",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      actorType: "system",
      action: "agent_task.enqueued",
      targetTable: "agentTasks",
      targetId: agentTaskId,
      summary: `${args.assignedAgent} task enqueued: ${args.type}.`,
      createdAt: now,
    });

    return agentTaskId;
  },
});

export const claimAgentTask = mutation({
  args: {
    agentTaskId: v.id("agentTasks"),
  },
  handler: async (ctx, args) => {
    const agentTask = await ctx.db.get(args.agentTaskId);

    if (agentTask === null) {
      throw new Error("Agent task not found.");
    }

    if (agentTask.status !== "queued") {
      throw new Error(`Agent task is ${agentTask.status}, not queued.`);
    }

    const now = Date.now();
    await ctx.db.patch(args.agentTaskId, {
      status: "running",
      attempts: agentTask.attempts + 1,
      updatedAt: now,
    });

    return args.agentTaskId;
  },
});

export const completeAgentTask = mutation({
  args: {
    agentTaskId: v.id("agentTasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentTaskId, {
      status: "completed",
      updatedAt: Date.now(),
    });

    return args.agentTaskId;
  },
});

export const failAgentTask = mutation({
  args: {
    agentTaskId: v.id("agentTasks"),
    lastError: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentTaskId, {
      status: "failed",
      lastError: args.lastError,
      updatedAt: Date.now(),
    });

    return args.agentTaskId;
  },
});

export const listQueuedAgentTasks = query({
  args: {
    orgId: v.id("orgs"),
    assignedAgent: v.optional(agentName),
    now: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tasks = args.assignedAgent
      ? await ctx.db
          .query("agentTasks")
          .withIndex("by_orgId_and_assignedAgent_and_status", (q) =>
            q.eq("orgId", args.orgId).eq("assignedAgent", args.assignedAgent!).eq("status", "queued"),
          )
          .order("asc")
          .take(args.limit ?? 25)
      : await ctx.db
          .query("agentTasks")
          .withIndex("by_orgId_and_status", (q) => q.eq("orgId", args.orgId).eq("status", "queued"))
          .order("asc")
          .take(args.limit ?? 25);

    const now = args.now ?? Date.now();
    return tasks.filter((task) => task.runAfter === undefined || task.runAfter <= now);
  },
});

export const getAgentTask = query({
  args: {
    agentTaskId: v.id("agentTasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentTaskId);
  },
});
