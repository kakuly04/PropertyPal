import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const leaseExtractionStatus = v.union(
  v.literal("not_started"),
  v.literal("extracting"),
  v.literal("needs_review"),
  v.literal("completed"),
  v.literal("failed"),
);

const paymentFrequency = v.union(
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("yearly"),
  v.literal("unknown"),
);

export const createLeaseFromPdf = mutation({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    tenantId: v.optional(v.id("contacts")),
    leaseFileId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const leaseId = await ctx.db.insert("leases", {
      ...args,
      extractionStatus: "not_started",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      actorType: "system",
      action: "lease.created",
      targetTable: "leases",
      targetId: leaseId,
      summary: "Lease record created from PDF upload.",
      createdAt: now,
    });

    return leaseId;
  },
});

export const updateLeaseExtraction = mutation({
  args: {
    leaseId: v.id("leases"),
    tenantId: v.optional(v.id("contacts")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    rentAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    paymentFrequency: v.optional(paymentFrequency),
    depositAmount: v.optional(v.number()),
    extractedTenantName: v.optional(v.string()),
    extractedPropertyAddress: v.optional(v.string()),
    extractionConfidence: v.optional(v.number()),
    extractionStatus: leaseExtractionStatus,
  },
  handler: async (ctx, args) => {
    const { leaseId, ...updates } = args;
    const lease = await ctx.db.get(leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const now = Date.now();

    await ctx.db.patch(leaseId, {
      ...updates,
      status: updates.extractionStatus === "failed" ? "draft" : lease.status,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: "agent",
      actorId: "ContractAgent",
      action: "lease.extraction_updated",
      targetTable: "leases",
      targetId: leaseId,
      summary: `Lease extraction status changed to ${updates.extractionStatus}.`,
      metadata: {
        extractionConfidence: updates.extractionConfidence,
      },
      createdAt: now,
    });

    return leaseId;
  },
});

export const submitLeaseExtractionForReview = mutation({
  args: {
    leaseId: v.id("leases"),
    requestedByRunId: v.optional(v.id("agentRuns")),
    summary: v.optional(v.string()),
    details: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db.get(args.leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.leaseId, {
      extractionStatus: "needs_review",
      updatedAt: now,
    });

    const approvalId = await ctx.db.insert("approvals", {
      orgId: lease.orgId,
      requestedByAgent: "ContractAgent",
      requestedByRunId: args.requestedByRunId,
      actionType: "confirm_lease_extraction",
      targetTable: "leases",
      targetId: args.leaseId,
      summary: args.summary ?? "Confirm extracted lease details.",
      details: args.details,
      status: "pending",
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: "agent",
      actorId: "ContractAgent",
      action: "lease.submitted_for_review",
      targetTable: "leases",
      targetId: args.leaseId,
      summary: "Lease extraction submitted for manager review.",
      metadata: { approvalId },
      createdAt: now,
    });

    return { leaseId: args.leaseId, approvalId };
  },
});

export const confirmLeaseExtraction = mutation({
  args: {
    leaseId: v.id("leases"),
    approvalId: v.optional(v.id("approvals")),
    decidedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db.get(args.leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.leaseId, {
      extractionStatus: "completed",
      status: "active",
      updatedAt: now,
    });

    if (args.approvalId !== undefined) {
      await ctx.db.patch(args.approvalId, {
        status: "approved",
        decidedByMembershipId: args.decidedByMembershipId,
        decidedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: args.decidedByMembershipId === undefined ? "system" : "user",
      actorId: args.decidedByMembershipId,
      action: "lease.extraction_confirmed",
      targetTable: "leases",
      targetId: args.leaseId,
      summary: "Lease extraction confirmed.",
      createdAt: now,
    });

    return args.leaseId;
  },
});

export const getLease = query({
  args: {
    leaseId: v.id("leases"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leaseId);
  },
});

export const listLeasesByOrg = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leases")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listLeasesByProperty = query({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leases")
      .withIndex("by_orgId_and_propertyId", (q) =>
        q.eq("orgId", args.orgId).eq("propertyId", args.propertyId),
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listExpiringLeases = query({
  args: {
    orgId: v.id("orgs"),
    endDateOnOrBefore: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leases")
      .withIndex("by_orgId_and_endDate", (q) =>
        q.eq("orgId", args.orgId).lte("endDate", args.endDateOnOrBefore),
      )
      .take(args.limit ?? 100);
  },
});
