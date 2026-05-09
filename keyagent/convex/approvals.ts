import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const agentName = v.union(
  v.literal("MaintenanceAgent"),
  v.literal("ContractAgent"),
  v.literal("InvoiceAgent"),
  v.literal("CommsAgent"),
  v.literal("OrchestratorAgent"),
);

const approvalActionType = v.union(
  v.literal("approve_invoice_reimbursement"),
  v.literal("confirm_lease_extraction"),
  v.literal("schedule_lease_renewal_meeting"),
  v.literal("approve_relisting"),
  v.literal("send_sensitive_message"),
  v.literal("other"),
);

export const createApproval = mutation({
  args: {
    orgId: v.id("orgs"),
    requestedByAgent: agentName,
    requestedByRunId: v.optional(v.id("agentRuns")),
    actionType: approvalActionType,
    targetTable: v.string(),
    targetId: v.string(),
    summary: v.string(),
    details: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("approvals", {
      ...args,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const approveRequest = mutation({
  args: {
    approvalId: v.id("approvals"),
    decidedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.approvalId, {
      status: "approved",
      decidedByMembershipId: args.decidedByMembershipId,
      decidedAt: now,
      updatedAt: now,
    });

    return args.approvalId;
  },
});

export const rejectRequest = mutation({
  args: {
    approvalId: v.id("approvals"),
    decidedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.approvalId, {
      status: "rejected",
      decidedByMembershipId: args.decidedByMembershipId,
      decidedAt: now,
      updatedAt: now,
    });

    return args.approvalId;
  },
});

export const getApproval = query({
  args: {
    approvalId: v.id("approvals"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.approvalId);
  },
});

export const listPendingApprovals = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("approvals")
      .withIndex("by_orgId_and_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "pending"),
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});
