import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const propertyStatus = v.union(v.literal("active"), v.literal("vacant"), v.literal("inactive"));

export const createProperty = mutation({
  args: {
    orgId: v.id("orgs"),
    name: v.optional(v.string()),
    address: v.string(),
    unitNo: v.optional(v.string()),
    ownerId: v.optional(v.id("contacts")),
    tenantId: v.optional(v.id("contacts")),
    managerMembershipId: v.optional(v.id("memberships")),
    status: v.optional(propertyStatus),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const propertyId = await ctx.db.insert("properties", {
      ...args,
      status: args.status ?? "active",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      actorType: "system",
      action: "property.created",
      targetTable: "properties",
      targetId: propertyId,
      summary: `Property created: ${args.address}.`,
      createdAt: now,
    });

    return propertyId;
  },
});

export const listProperties = query({
  args: {
    orgId: v.id("orgs"),
    status: v.optional(propertyStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      return await ctx.db
        .query("properties")
        .withIndex("by_orgId_and_status", (q) => q.eq("orgId", args.orgId).eq("status", args.status!))
        .order("asc")
        .take(args.limit ?? 50);
    }

    return await ctx.db
      .query("properties")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("asc")
      .take(args.limit ?? 50);
  },
});

export const getProperty = query({
  args: {
    propertyId: v.id("properties"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.propertyId);
  },
});
