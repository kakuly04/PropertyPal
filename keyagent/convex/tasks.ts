import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const taskType = v.union(
  v.literal("maintenance"),
  v.literal("lease_renewal"),
  v.literal("invoice_reimbursement"),
  v.literal("relisting"),
  v.literal("general"),
);

const taskStatus = v.union(
  v.literal("open"),
  v.literal("in_progress"),
  v.literal("waiting_for_approval"),
  v.literal("pending_verification"),
  v.literal("done"),
  v.literal("cancelled"),
  v.literal("failed"),
);

const agentName = v.union(
  v.literal("MaintenanceAgent"),
  v.literal("ContractAgent"),
  v.literal("InvoiceAgent"),
  v.literal("CommsAgent"),
  v.literal("OrchestratorAgent"),
);

const priority = v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"));

export const createMaintenanceTask = mutation({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    title: v.string(),
    description: v.string(),
    tenantId: v.optional(v.id("contacts")),
    ownerId: v.optional(v.id("contacts")),
    priority: v.optional(priority),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      type: "maintenance",
      status: "open",
      assignedAgent: "MaintenanceAgent",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      actorType: "agent",
      actorId: "MaintenanceAgent",
      action: "task.created",
      targetTable: "tasks",
      targetId: taskId,
      summary: `Maintenance task created: ${args.title}.`,
      createdAt: now,
    });

    return taskId;
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: taskStatus,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);

    if (task === null) {
      throw new Error("Task not found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: args.status,
      notes: args.notes ?? task.notes,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: task.orgId,
      actorType: "agent",
      actorId: task.assignedAgent,
      action: "task.status_updated",
      targetTable: "tasks",
      targetId: args.taskId,
      summary: `Task status changed to ${args.status}.`,
      createdAt: now,
    });

    return args.taskId;
  },
});

export const assignContractor = mutation({
  args: {
    taskId: v.id("tasks"),
    contractorId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);

    if (task === null) {
      throw new Error("Task not found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      contractorId: args.contractorId,
      status: "in_progress",
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: task.orgId,
      actorType: "agent",
      actorId: "MaintenanceAgent",
      action: "task.contractor_assigned",
      targetTable: "tasks",
      targetId: args.taskId,
      summary: "Contractor assigned to maintenance task.",
      metadata: { contractorId: args.contractorId },
      createdAt: now,
    });

    return args.taskId;
  },
});

export const listTasks = query({
  args: {
    orgId: v.id("orgs"),
    type: v.optional(taskType),
    status: v.optional(taskStatus),
    assignedAgent: v.optional(agentName),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.assignedAgent !== undefined) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_orgId_and_assignedAgent", (q) =>
          q.eq("orgId", args.orgId).eq("assignedAgent", args.assignedAgent!),
        )
        .order("desc")
        .take(args.limit ?? 50);
    }

    if (args.status !== undefined) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_orgId_and_status", (q) => q.eq("orgId", args.orgId).eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 50);
    }

    if (args.type !== undefined) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_orgId_and_type", (q) => q.eq("orgId", args.orgId).eq("type", args.type!))
        .order("desc")
        .take(args.limit ?? 50);
    }

    return await ctx.db
      .query("tasks")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});
