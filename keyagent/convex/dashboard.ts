import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

async function getOrgId(ctx: QueryCtx, slug: string): Promise<Id<"orgs"> | null> {
  const org = await ctx.db
    .query("orgs")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  return org?._id ?? null;
}

async function loadBase(ctx: QueryCtx, orgId: Id<"orgs">) {
  const properties = await ctx.db
    .query("properties")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .take(100);
  const contacts = await ctx.db
    .query("contacts")
    .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
    .take(200);
  return { properties, contacts };
}

function contactName(contacts: Doc<"contacts">[], contactId?: Id<"contacts">) {
  return contacts.find((contact) => contact._id === contactId)?.name ?? "Unassigned";
}

function propertyLabel(properties: Doc<"properties">[], propertyId?: Id<"properties">) {
  const property = properties.find((row) => row._id === propertyId);
  if (property === undefined) {
    return "Unassigned property";
  }
  return [property.address, property.unitNo].filter(Boolean).join(" ");
}

function workflowStatus(status: string) {
  if (status === "queued") return "Queued";
  if (status === "running") return "Running";
  if (status === "waiting_for_approval") return "Awaiting approval";
  if (status === "failed") return "Failed";
  return "Completed";
}

export const getOverview = query({
  args: { orgSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx, args.orgSlug ?? "demo");
    if (orgId === null) {
      return null;
    }
    const [tasks, approvals, leases, invoices, conversations, runs] = await Promise.all([
      ctx.db.query("tasks").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100),
      ctx.db.query("approvals").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100),
      ctx.db.query("leases").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100),
      ctx.db.query("invoices").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100),
      ctx.db.query("conversations").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100),
      ctx.db.query("agentRuns").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100),
    ]);
    const activeRuns = runs.filter((run) => run.status === "running" || run.status === "queued" || run.status === "waiting_for_approval");
    const pendingApprovals = approvals.filter((approval) => approval.status === "pending");
    const openMaintenance = tasks.filter((task) => task.type === "maintenance" && task.status !== "done" && task.status !== "cancelled");
    const expiringLeases = leases.filter((lease) => lease.status === "expiring" || lease.status === "active");
    const pendingInvoices = invoices.filter((invoice) => invoice.status === "pending_approval" || invoice.status === "uploaded");
    const unreadConversations = conversations.filter((conversation) => conversation.status !== "closed");
    const failedRuns = runs.filter((run) => run.status === "failed");
    return {
      orgId,
      stats: {
        activeWorkflows: activeRuns.length,
        pendingApprovals: pendingApprovals.length,
        openMaintenance: openMaintenance.length,
        expiringLeases: expiringLeases.length,
        unreadConversations: unreadConversations.length,
        pendingInvoices: pendingInvoices.length,
        agentHealth: runs.length === 0 ? 100 : Math.round(((runs.length - failedRuns.length) / runs.length) * 1000) / 10,
        slaRisks: tasks.filter((task) => task.priority === "high" || task.priority === "urgent").length,
      },
    };
  },
});

export const listPropertiesForDashboard = query({
  args: { orgSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx, args.orgSlug ?? "demo");
    if (orgId === null) return [];
    const { properties, contacts } = await loadBase(ctx, orgId);
    const tasks = await ctx.db.query("tasks").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100);
    const invoices = await ctx.db.query("invoices").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100);
    const leases = await ctx.db.query("leases").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100);
    return properties.map((property) => {
      const propertyTasks = tasks.filter((task) => task.propertyId === property._id);
      const propertyInvoices = invoices.filter((invoice) => invoice.propertyId === property._id);
      const lease = leases.find((row) => row.propertyId === property._id);
      return {
        id: property._id,
        address: [property.address, property.unitNo].filter(Boolean).join(" "),
        units: property.unitNo ? [property.unitNo] : [],
        owner: contactName(contacts, property.ownerId),
        tenants: property.tenantId ? [contactName(contacts, property.tenantId)] : [],
        openMaintenance: propertyTasks.filter((task) => task.type === "maintenance" && task.status !== "done").length,
        leaseStatus: lease?.endDate ? `Active until ${lease.endDate}` : "No active lease",
        pendingInvoices: propertyInvoices.filter((invoice) => invoice.status === "pending_approval").length,
        recentActivity: propertyTasks[0]?.description ?? property.notes ?? "No recent activity",
      };
    });
  },
});

export const listOperations = query({
  args: { orgSlug: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx, args.orgSlug ?? "demo");
    if (orgId === null) return [];
    const { properties, contacts } = await loadBase(ctx, orgId);
    const [tasks, runs, approvals] = await Promise.all([
      ctx.db.query("agentTasks").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).order("desc").take(args.limit ?? 25),
      ctx.db.query("agentRuns").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).order("desc").take(args.limit ?? 25),
      ctx.db.query("approvals").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100),
    ]);
    const taskOps = tasks.map((task) => ({
      id: task._id,
      agent: task.assignedAgent,
      workflowType: task.type,
      property: propertyLabel(properties, task.propertyId),
      person: "Demo contact",
      timestamp: new Date(task.createdAt).toLocaleString(),
      status: workflowStatus(task.status),
      confidence: 90,
      proposedAction: String((task.payload as { summary?: string } | undefined)?.summary ?? `Process ${task.type}.`),
      approvalRequired: approvals.some((approval) => approval.status === "pending" && approval.targetId === task._id),
      handoffChain: ["OrchestratorAgent", task.assignedAgent],
      evidence: [task.eventId],
      related: task.taskId ? [`Task ${task.taskId}`] : [],
      audit: [`${task.assignedAgent} task ${task.status}`],
    }));
    const runOps = runs.map((run) => ({
      id: run._id,
      agent: run.agentName,
      workflowType: run.source,
      property: "Demo portfolio",
      person: contactName(contacts),
      timestamp: new Date(run.createdAt).toLocaleString(),
      status: workflowStatus(run.status),
      confidence: run.status === "failed" ? 35 : 92,
      proposedAction: run.outputSummary ?? run.inputSummary,
      approvalRequired: run.status === "waiting_for_approval",
      handoffChain: ["OrchestratorAgent", run.agentName],
      evidence: [run.eventId],
      related: [],
      audit: [run.inputSummary, run.outputSummary ?? run.status],
    }));
    return [...taskOps, ...runOps].slice(0, args.limit ?? 25);
  },
});

export const listApprovalsForDashboard = query({
  args: { orgSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx, args.orgSlug ?? "demo");
    if (orgId === null) return [];
    const { properties } = await loadBase(ctx, orgId);
    const approvals = await ctx.db.query("approvals").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).order("desc").take(50);
    return approvals.map((approval) => ({
      id: approval._id,
      action: approval.actionType,
      agent: approval.requestedByAgent,
      reason: approval.summary,
      evidence: [approval.targetTable, approval.details ?? "Convex audit available"],
      property: properties[0] ? propertyLabel(properties, properties[0]._id) : "Demo property",
      person: "Property manager",
      risk: approval.actionType === "approve_relisting" ? "High" : "Medium",
      deadline: approval.expiresAt ? new Date(approval.expiresAt).toLocaleDateString() : "No SLA",
      status: approval.status === "pending" ? "Pending" : approval.status === "approved" ? "Approved" : "Rejected",
      targetTable: approval.targetTable,
      targetId: approval.targetId,
    }));
  },
});

export const listDocumentsForDashboard = query({
  args: { orgSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx, args.orgSlug ?? "demo");
    if (orgId === null) return [];
    const files = await ctx.db.query("files").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).order("desc").take(100);
    return files.map((file) => ({
      id: file._id,
      category: file.purpose === "lease_pdf" ? "Lease PDFs" : file.purpose === "invoice_receipt" ? "Invoice PDFs/images" : "Property photos",
      fileName: file.originalName,
      linkedEntity: file.propertyId ?? "Unlinked",
      uploadedAt: new Date(file.createdAt).toLocaleString(),
      extractedStatus: file.status,
      confidence: file.status === "ready" ? 95 : 70,
      relatedAgent: file.purpose === "lease_pdf" ? "ContractAgent" : file.purpose === "invoice_receipt" ? "InvoiceAgent" : "MaintenanceAgent",
      reviewStatus: file.status,
      fields: {
        contentType: file.contentType,
        purpose: file.purpose,
      },
    }));
  },
});

export const listConversationsForDashboard = query({
  args: { orgSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx, args.orgSlug ?? "demo");
    if (orgId === null) return [];
    const { properties, contacts } = await loadBase(ctx, orgId);
    const conversations = await ctx.db.query("conversations").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).order("desc").take(25);
    const rows = [];
    for (const conversation of conversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_orgId_and_conversationId", (q) => q.eq("orgId", orgId).eq("conversationId", conversation._id))
        .order("asc")
        .take(20);
      const primary = contacts.find((contact) => contact._id === conversation.primaryContactId);
      rows.push({
        id: conversation._id,
        contact: primary?.name ?? "Demo contact",
        role: primary?.role === "contractor" ? "vendor" : primary?.role ?? "tenant",
        channel: conversation.channel === "whatsapp" ? "WhatsApp" : conversation.channel === "email" ? "Email" : "Voice",
        property: propertyLabel(properties, conversation.propertyId),
        latest: messages[messages.length - 1]?.body ?? conversation.subject ?? "No messages yet",
        assignedAgent: "CommsAgent",
        status: conversation.status,
        humanRequired: false,
        messages: messages.map((message) => ({
          author: message.direction === "inbound" ? primary?.name ?? "Contact" : "CommsAgent",
          body: message.body,
          time: new Date(message.createdAt).toLocaleTimeString(),
          kind: message.direction === "inbound" ? "inbound" : "agent",
        })),
        draftReply: "I will follow up and update the workflow once availability is confirmed.",
        sourceContext: [conversation.subject ?? "Conversation"],
        linkedWorkflow: conversation.taskId ?? "general_comms",
      });
    }
    return rows;
  },
});

export const listAgentsForDashboard = query({
  args: { orgSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const orgId = await getOrgId(ctx, args.orgSlug ?? "demo");
    if (orgId === null) return [];
    const runs = await ctx.db.query("agentRuns").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100);
    const tasks = await ctx.db.query("agentTasks").withIndex("by_orgId", (q) => q.eq("orgId", orgId)).take(100);
    const agents = [
      ["OrchestratorAgent", "Classifies events, loads context, and routes handoffs."],
      ["MaintenanceAgent", "Creates maintenance tasks, matches contractors, and coordinates fixes."],
      ["ContractAgent", "Extracts lease details, monitors expiry, and prepares relisting workflows."],
      ["CommsAgent", "Sends WhatsApp, email, voice, and calendar scheduling updates."],
      ["InvoiceAgent", "Extracts receipts and manages reimbursement approvals."],
    ] as const;
    return agents.map(([name, responsibility]) => ({
      name,
      responsibility,
      activeTasks: tasks.filter((task) => task.assignedAgent === name && task.status !== "completed").length,
      toolScope: ["Convex", name === "CommsAgent" ? "Twilio/Resend/Calendar" : "OpenAI"],
      approvalRequirements: name === "InvoiceAgent" ? ["Reimbursement approval"] : name === "ContractAgent" ? ["Lease review", "Relisting approval"] : ["Sensitive outbound messages"],
      recentHandoffs: runs.filter((run) => run.agentName === name).slice(0, 3).map((run) => run.eventId),
      errorCount: runs.filter((run) => run.agentName === name && run.status === "failed").length,
      lastRun: runs.find((run) => run.agentName === name)?.createdAt ? new Date(runs.find((run) => run.agentName === name)!.createdAt).toLocaleString() : "No runs yet",
    }));
  },
});
