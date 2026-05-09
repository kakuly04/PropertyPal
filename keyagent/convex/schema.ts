import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  properties: defineTable({
    address: v.string(),
    unitNo: v.string(),
    agentId: v.string(),
    ownerId: v.id("contacts"),
    tenantId: v.id("contacts"),
  }),

  contacts: defineTable({
    name: v.string(),
    role: v.union(v.literal("owner"), v.literal("tenant"), v.literal("contractor")),
    phone: v.string(),
    email: v.string(),
    trade: v.optional(v.string()), // plumber, electrician, cleaner
  }),

  leases: defineTable({
    propertyId: v.id("properties"),
    startDate: v.string(),
    endDate: v.string(),
    rentAmount: v.number(),
    status: v.union(v.literal("active"), v.literal("expiring"), v.literal("expired")),
  }),

  tasks: defineTable({
    propertyId: v.id("properties"),
    type: v.union(v.literal("maintenance"), v.literal("renewal"), v.literal("reimbursement")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("pending_verification"), v.literal("done")),
    title: v.string(),
    description: v.string(),
    contractorId: v.optional(v.id("contacts")),
    dueDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),

  invoices: defineTable({
    taskId: v.id("tasks"),
    amount: v.number(),
    paidBy: v.string(),
    receiptUrl: v.optional(v.string()),
    reimbursedAt: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("reimbursed")),
  }),
});