import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const contactRole = v.union(
  v.literal("owner"),
  v.literal("tenant"),
  v.literal("contractor"),
  v.literal("property_manager"),
);

const contactStatus = v.union(v.literal("active"), v.literal("inactive"));

export const createContact = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.string(),
    role: contactRole,
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    trade: v.optional(v.string()),
    companyName: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(contactStatus),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const contactId = await ctx.db.insert("contacts", {
      ...args,
      status: args.status ?? "active",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      actorType: "system",
      action: "contact.created",
      targetTable: "contacts",
      targetId: contactId,
      summary: `${args.role} contact created: ${args.name}.`,
      createdAt: now,
    });

    return contactId;
  },
});

export const listContactsByRole = query({
  args: {
    orgId: v.id("orgs"),
    role: contactRole,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_orgId_and_role", (q) => q.eq("orgId", args.orgId).eq("role", args.role))
      .order("asc")
      .take(args.limit ?? 50);
  },
});

export const lookupContractorsByTrade = query({
  args: {
    orgId: v.id("orgs"),
    trade: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const contractors = await ctx.db
      .query("contacts")
      .withIndex("by_orgId_and_role", (q) => q.eq("orgId", args.orgId).eq("role", "contractor"))
      .take(100);

    return contractors
      .filter((contractor) => contractor.status === "active")
      .filter((contractor) => contractor.trade?.toLowerCase() === args.trade.toLowerCase())
      .slice(0, args.limit ?? 10);
  },
});

export const getContact = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contactId);
  },
});
