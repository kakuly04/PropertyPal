import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const invoiceExtractionStatus = v.union(
  v.literal("not_started"),
  v.literal("extracting"),
  v.literal("needs_review"),
  v.literal("completed"),
  v.literal("failed"),
);

export const createInvoiceFromReceipt = mutation({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    taskId: v.optional(v.id("tasks")),
    submittedByContactId: v.optional(v.id("contacts")),
    receiptFileId: v.optional(v.id("files")),
    paidBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const invoiceId = await ctx.db.insert("invoices", {
      ...args,
      extractionStatus: "not_started",
      status: "uploaded",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      actorType: "system",
      action: "invoice.created",
      targetTable: "invoices",
      targetId: invoiceId,
      summary: "Invoice claim created from receipt upload.",
      createdAt: now,
    });

    return invoiceId;
  },
});

export const updateInvoiceExtraction = mutation({
  args: {
    invoiceId: v.id("invoices"),
    vendorName: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    invoiceDate: v.optional(v.string()),
    category: v.optional(v.string()),
    paidBy: v.optional(v.string()),
    extractionConfidence: v.optional(v.number()),
    extractionStatus: invoiceExtractionStatus,
  },
  handler: async (ctx, args) => {
    const { invoiceId, ...updates } = args;
    const invoice = await ctx.db.get(invoiceId);

    if (invoice === null) {
      throw new Error("Invoice not found.");
    }

    const now = Date.now();

    await ctx.db.patch(invoiceId, {
      ...updates,
      status: updates.extractionStatus === "failed" ? "failed" : invoice.status,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: invoice.orgId,
      actorType: "agent",
      actorId: "InvoiceAgent",
      action: "invoice.extraction_updated",
      targetTable: "invoices",
      targetId: invoiceId,
      summary: `Invoice extraction status changed to ${updates.extractionStatus}.`,
      metadata: {
        extractionConfidence: updates.extractionConfidence,
      },
      createdAt: now,
    });

    return invoiceId;
  },
});

export const submitInvoiceForApproval = mutation({
  args: {
    invoiceId: v.id("invoices"),
    requestedByRunId: v.optional(v.id("agentRuns")),
    summary: v.optional(v.string()),
    details: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);

    if (invoice === null) {
      throw new Error("Invoice not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.invoiceId, {
      status: "pending_approval",
      updatedAt: now,
    });

    const approvalId = await ctx.db.insert("approvals", {
      orgId: invoice.orgId,
      requestedByAgent: "InvoiceAgent",
      requestedByRunId: args.requestedByRunId,
      actionType: "approve_invoice_reimbursement",
      targetTable: "invoices",
      targetId: args.invoiceId,
      summary:
        args.summary ??
        `Approve reimbursement for ${invoice.vendorName ?? "uploaded receipt"}.`,
      details: args.details,
      status: "pending",
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: invoice.orgId,
      actorType: "agent",
      actorId: "InvoiceAgent",
      action: "invoice.submitted_for_approval",
      targetTable: "invoices",
      targetId: args.invoiceId,
      summary: "Invoice claim submitted for manager approval.",
      metadata: { approvalId },
      createdAt: now,
    });

    return { invoiceId: args.invoiceId, approvalId };
  },
});

export const approveInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
    approvalId: v.optional(v.id("approvals")),
    decidedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);

    if (invoice === null) {
      throw new Error("Invoice not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.invoiceId, {
      status: "approved",
      approvedAt: now,
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
      orgId: invoice.orgId,
      actorType: args.decidedByMembershipId === undefined ? "system" : "user",
      actorId: args.decidedByMembershipId,
      action: "invoice.approved",
      targetTable: "invoices",
      targetId: args.invoiceId,
      summary: "Invoice reimbursement approved.",
      createdAt: now,
    });

    return args.invoiceId;
  },
});

export const rejectInvoice = mutation({
  args: {
    invoiceId: v.id("invoices"),
    approvalId: v.optional(v.id("approvals")),
    decidedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);

    if (invoice === null) {
      throw new Error("Invoice not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.invoiceId, {
      status: "rejected",
      updatedAt: now,
    });

    if (args.approvalId !== undefined) {
      await ctx.db.patch(args.approvalId, {
        status: "rejected",
        decidedByMembershipId: args.decidedByMembershipId,
        decidedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      orgId: invoice.orgId,
      actorType: args.decidedByMembershipId === undefined ? "system" : "user",
      actorId: args.decidedByMembershipId,
      action: "invoice.rejected",
      targetTable: "invoices",
      targetId: args.invoiceId,
      summary: "Invoice reimbursement rejected.",
      createdAt: now,
    });

    return args.invoiceId;
  },
});

export const markInvoiceReimbursed = mutation({
  args: {
    invoiceId: v.id("invoices"),
    reimbursedAt: v.optional(v.string()),
    queueTenantConfirmation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);

    if (invoice === null) {
      throw new Error("Invoice not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.invoiceId, {
      status: "reimbursed",
      reimbursedAt: args.reimbursedAt ?? new Date(now).toISOString(),
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: invoice.orgId,
      actorType: "system",
      action: "invoice.reimbursed",
      targetTable: "invoices",
      targetId: args.invoiceId,
      summary: "Invoice marked as reimbursed.",
      createdAt: now,
    });

    let commsTaskId = null;
    if (args.queueTenantConfirmation === true && invoice.submittedByContactId !== undefined) {
      commsTaskId = await ctx.db.insert("agentTasks", {
        orgId: invoice.orgId,
        assignedAgent: "CommsAgent",
        eventId: `invoice-reimbursed:${args.invoiceId}:${now}`,
        source: "dashboard",
        type: "send_invoice_reimbursement_confirmation",
        status: "queued",
        propertyId: invoice.propertyId,
        taskId: invoice.taskId,
        payload: {
          invoiceId: args.invoiceId,
          recipientContactId: invoice.submittedByContactId,
          amount: invoice.amount,
          currency: invoice.currency,
          vendorName: invoice.vendorName,
          reimbursedAt: args.reimbursedAt ?? new Date(now).toISOString(),
        },
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("auditLogs", {
        orgId: invoice.orgId,
        actorType: "system",
        action: "invoice.reimbursement_confirmation_queued",
        targetTable: "invoices",
        targetId: args.invoiceId,
        summary: "Queued CommsAgent confirmation for reimbursed invoice.",
        metadata: { commsTaskId },
        createdAt: now,
      });
    }

    return { invoiceId: args.invoiceId, commsTaskId };
  },
});

export const getInvoice = query({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.invoiceId);
  },
});

export const listInvoicesByOrg = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listInvoicesByProperty = query({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_orgId_and_propertyId", (q) =>
        q.eq("orgId", args.orgId).eq("propertyId", args.propertyId),
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});
