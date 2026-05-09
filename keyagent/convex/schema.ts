import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orgs: defineTable({
    name: v.string(),
    slug: v.string(),
    timezone: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  memberships: defineTable({
    orgId: v.id("orgs"),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("agent"),
      v.literal("viewer"),
    ),
    status: v.union(v.literal("active"), v.literal("invited"), v.literal("disabled")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_userId", ["userId"])
    .index("by_orgId_and_userId", ["orgId", "userId"]),

  contacts: defineTable({
    orgId: v.id("orgs"),
    name: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("tenant"),
      v.literal("contractor"),
      v.literal("property_manager"),
    ),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    trade: v.optional(v.string()),
    companyName: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_role", ["orgId", "role"])
    .index("by_orgId_and_email", ["orgId", "email"])
    .index("by_orgId_and_phone", ["orgId", "phone"]),

  properties: defineTable({
    orgId: v.id("orgs"),
    name: v.optional(v.string()),
    address: v.string(),
    unitNo: v.optional(v.string()),
    ownerId: v.optional(v.id("contacts")),
    tenantId: v.optional(v.id("contacts")),
    managerMembershipId: v.optional(v.id("memberships")),
    status: v.union(v.literal("active"), v.literal("vacant"), v.literal("inactive")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_ownerId", ["orgId", "ownerId"])
    .index("by_orgId_and_tenantId", ["orgId", "tenantId"]),

  files: defineTable({
    orgId: v.id("orgs"),
    storageId: v.string(),
    uploadedByMembershipId: v.optional(v.id("memberships")),
    propertyId: v.optional(v.id("properties")),
    taskId: v.optional(v.id("tasks")),
    originalName: v.string(),
    contentType: v.string(),
    sizeBytes: v.optional(v.number()),
    purpose: v.union(
      v.literal("lease_pdf"),
      v.literal("invoice_receipt"),
      v.literal("listing_photo"),
      v.literal("maintenance_photo"),
      v.literal("other"),
    ),
    status: v.union(v.literal("uploaded"), v.literal("processing"), v.literal("ready"), v.literal("failed")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_purpose", ["orgId", "purpose"])
    .index("by_orgId_and_propertyId", ["orgId", "propertyId"])
    .index("by_orgId_and_taskId", ["orgId", "taskId"]),

  leases: defineTable({
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    tenantId: v.optional(v.id("contacts")),
    leaseFileId: v.optional(v.id("files")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    rentAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    paymentFrequency: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("yearly"),
        v.literal("unknown"),
      ),
    ),
    depositAmount: v.optional(v.number()),
    extractedTenantName: v.optional(v.string()),
    extractedPropertyAddress: v.optional(v.string()),
    extractionConfidence: v.optional(v.number()),
    extractionStatus: v.union(
      v.literal("not_started"),
      v.literal("extracting"),
      v.literal("needs_review"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("expiring"),
      v.literal("expired"),
      v.literal("terminated"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_propertyId", ["orgId", "propertyId"])
    .index("by_orgId_and_tenantId", ["orgId", "tenantId"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_endDate", ["orgId", "endDate"])
    .index("by_orgId_and_extractionStatus", ["orgId", "extractionStatus"]),

  tasks: defineTable({
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    type: v.union(
      v.literal("maintenance"),
      v.literal("lease_renewal"),
      v.literal("invoice_reimbursement"),
      v.literal("relisting"),
      v.literal("general"),
    ),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("waiting_for_approval"),
      v.literal("pending_verification"),
      v.literal("done"),
      v.literal("cancelled"),
      v.literal("failed"),
    ),
    title: v.string(),
    description: v.string(),
    assignedAgent: v.optional(
      v.union(
        v.literal("MaintenanceAgent"),
        v.literal("ContractAgent"),
        v.literal("InvoiceAgent"),
        v.literal("CommsAgent"),
        v.literal("OrchestratorAgent"),
      ),
    ),
    tenantId: v.optional(v.id("contacts")),
    ownerId: v.optional(v.id("contacts")),
    contractorId: v.optional(v.id("contacts")),
    relatedLeaseId: v.optional(v.id("leases")),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_propertyId", ["orgId", "propertyId"])
    .index("by_orgId_and_type", ["orgId", "type"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_assignedAgent", ["orgId", "assignedAgent"])
    .index("by_orgId_and_dueDate", ["orgId", "dueDate"]),

  invoices: defineTable({
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    taskId: v.optional(v.id("tasks")),
    submittedByContactId: v.optional(v.id("contacts")),
    receiptFileId: v.optional(v.id("files")),
    vendorName: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    invoiceDate: v.optional(v.string()),
    category: v.optional(v.string()),
    paidBy: v.optional(v.string()),
    extractionConfidence: v.optional(v.number()),
    extractionStatus: v.union(
      v.literal("not_started"),
      v.literal("extracting"),
      v.literal("needs_review"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    status: v.union(
      v.literal("uploaded"),
      v.literal("pending_approval"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("reimbursed"),
      v.literal("failed"),
    ),
    approvedAt: v.optional(v.number()),
    reimbursedAt: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_propertyId", ["orgId", "propertyId"])
    .index("by_orgId_and_taskId", ["orgId", "taskId"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_extractionStatus", ["orgId", "extractionStatus"]),

  approvals: defineTable({
    orgId: v.id("orgs"),
    requestedByAgent: v.union(
      v.literal("MaintenanceAgent"),
      v.literal("ContractAgent"),
      v.literal("InvoiceAgent"),
      v.literal("CommsAgent"),
      v.literal("OrchestratorAgent"),
    ),
    requestedByRunId: v.optional(v.id("agentRuns")),
    actionType: v.union(
      v.literal("approve_invoice_reimbursement"),
      v.literal("confirm_lease_extraction"),
      v.literal("schedule_lease_renewal_meeting"),
      v.literal("approve_relisting"),
      v.literal("send_sensitive_message"),
      v.literal("other"),
    ),
    targetTable: v.string(),
    targetId: v.string(),
    summary: v.string(),
    details: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
      v.literal("expired"),
    ),
    decidedByMembershipId: v.optional(v.id("memberships")),
    decidedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_actionType", ["orgId", "actionType"])
    .index("by_orgId_and_targetTable_and_targetId", ["orgId", "targetTable", "targetId"]),

  agentRuns: defineTable({
    orgId: v.id("orgs"),
    agentName: v.union(
      v.literal("MaintenanceAgent"),
      v.literal("ContractAgent"),
      v.literal("InvoiceAgent"),
      v.literal("CommsAgent"),
      v.literal("OrchestratorAgent"),
    ),
    eventId: v.string(),
    source: v.union(v.literal("dashboard"), v.literal("whatsapp"), v.literal("email"), v.literal("cron"), v.literal("upload")),
    inputSummary: v.string(),
    outputSummary: v.optional(v.string()),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("waiting_for_approval"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_agentName", ["orgId", "agentName"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_eventId", ["orgId", "eventId"]),

  agentTasks: defineTable({
    orgId: v.id("orgs"),
    assignedAgent: v.union(
      v.literal("MaintenanceAgent"),
      v.literal("ContractAgent"),
      v.literal("InvoiceAgent"),
      v.literal("CommsAgent"),
      v.literal("OrchestratorAgent"),
    ),
    eventId: v.string(),
    source: v.union(v.literal("dashboard"), v.literal("whatsapp"), v.literal("email"), v.literal("cron"), v.literal("upload")),
    type: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("waiting_for_approval"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("failed"),
    ),
    propertyId: v.optional(v.id("properties")),
    taskId: v.optional(v.id("tasks")),
    fileId: v.optional(v.id("files")),
    approvalId: v.optional(v.id("approvals")),
    payload: v.optional(v.any()),
    runAfter: v.optional(v.number()),
    attempts: v.number(),
    lastError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_assignedAgent", ["orgId", "assignedAgent"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_assignedAgent_and_status", ["orgId", "assignedAgent", "status"])
    .index("by_orgId_and_runAfter", ["orgId", "runAfter"]),

  auditLogs: defineTable({
    orgId: v.id("orgs"),
    actorType: v.union(v.literal("user"), v.literal("agent"), v.literal("system")),
    actorId: v.optional(v.string()),
    agentRunId: v.optional(v.id("agentRuns")),
    action: v.string(),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    summary: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_action", ["orgId", "action"])
    .index("by_orgId_and_targetTable_and_targetId", ["orgId", "targetTable", "targetId"])
    .index("by_orgId_and_agentRunId", ["orgId", "agentRunId"]),

  conversations: defineTable({
    orgId: v.id("orgs"),
    channel: v.union(v.literal("whatsapp"), v.literal("email"), v.literal("voice"), v.literal("dashboard")),
    subject: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
    taskId: v.optional(v.id("tasks")),
    primaryContactId: v.optional(v.id("contacts")),
    status: v.union(v.literal("open"), v.literal("waiting"), v.literal("closed")),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_channel", ["orgId", "channel"])
    .index("by_orgId_and_status", ["orgId", "status"])
    .index("by_orgId_and_propertyId", ["orgId", "propertyId"])
    .index("by_orgId_and_taskId", ["orgId", "taskId"]),

  messages: defineTable({
    orgId: v.id("orgs"),
    conversationId: v.id("conversations"),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    channel: v.union(v.literal("whatsapp"), v.literal("email"), v.literal("voice"), v.literal("dashboard")),
    senderContactId: v.optional(v.id("contacts")),
    recipientContactId: v.optional(v.id("contacts")),
    agentRunId: v.optional(v.id("agentRuns")),
    body: v.string(),
    externalMessageId: v.optional(v.string()),
    deliveryStatus: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed"),
      v.literal("received"),
    ),
    sentAt: v.optional(v.number()),
    receivedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_conversationId", ["orgId", "conversationId"])
    .index("by_orgId_and_channel", ["orgId", "channel"])
    .index("by_orgId_and_deliveryStatus", ["orgId", "deliveryStatus"]),
});
