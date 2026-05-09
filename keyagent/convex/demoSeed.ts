import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEMO_SLUG = "demo";

export const ensureDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let org = await ctx.db
      .query("orgs")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();

    const orgId =
      org?._id ??
      (await ctx.db.insert("orgs", {
        name: "Demo Property Management",
        slug: DEMO_SLUG,
        timezone: "Asia/Singapore",
        createdAt: now,
        updatedAt: now,
      }));

    org = await ctx.db.get(orgId);
    if (org === null) {
      throw new Error("Failed to create demo org.");
    }

    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_orgId_and_userId", (q) =>
        q.eq("orgId", orgId).eq("userId", "demo-manager"),
      )
      .unique();
    const managerMembershipId =
      existingMembership?._id ??
      (await ctx.db.insert("memberships", {
        orgId,
        userId: "demo-manager",
        email: "manager@example.com",
        name: "Demo Manager",
        role: "admin",
        status: "active",
        createdAt: now,
        updatedAt: now,
      }));

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    const owner =
      contacts.find((contact) => contact.role === "owner") ??
      (await ctx.db.insert("contacts", {
        orgId,
        name: "Horizon Crest Properties Pte. Ltd.",
        role: "owner",
        email: "owner@example.com",
        phone: "+6560000001",
        status: "active",
        createdAt: now,
        updatedAt: now,
      }));
    const tenant =
      contacts.find((contact) => contact.role === "tenant") ??
      (await ctx.db.insert("contacts", {
        orgId,
        name: "Priya Menon",
        role: "tenant",
        email: "tenant@example.com",
        phone: "+6560000002",
        status: "active",
        createdAt: now,
        updatedAt: now,
      }));

    const ownerId = typeof owner === "string" ? owner : owner._id;
    const tenantId = typeof tenant === "string" ? tenant : tenant._id;

    const properties = await ctx.db
      .query("properties")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    const property =
      properties[0] ??
      (await ctx.db.insert("properties", {
        orgId,
        name: "Cantonment Close Demo Unit",
        address: "71 Cantonment Close",
        unitNo: "#12-184",
        ownerId,
        tenantId,
        managerMembershipId,
        status: "active",
        notes: "Demo property for invoice and contract agent testing.",
        createdAt: now,
        updatedAt: now,
      }));
    const propertyId = typeof property === "string" ? property : property._id;

    return {
      orgId,
      managerMembershipId,
      ownerId,
      tenantId,
      propertyId,
    };
  },
});

export const createDemoExternalFile = mutation({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    externalUrl: v.string(),
    originalName: v.string(),
    contentType: v.string(),
    purpose: v.union(v.literal("lease_pdf"), v.literal("invoice_receipt")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("files", {
      orgId: args.orgId,
      propertyId: args.propertyId,
      storageId: `external:${args.externalUrl}`,
      externalUrl: args.externalUrl,
      originalName: args.originalName,
      contentType: args.contentType,
      purpose: args.purpose,
      status: "uploaded",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getDemoData = query({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db
      .query("orgs")
      .withIndex("by_slug", (q) => q.eq("slug", DEMO_SLUG))
      .unique();

    if (org === null) {
      return null;
    }

    const properties = await ctx.db
      .query("properties")
      .withIndex("by_orgId", (q) => q.eq("orgId", org._id))
      .take(10);
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_orgId", (q) => q.eq("orgId", org._id))
      .take(20);

    return {
      org,
      orgId: org._id,
      propertyId: properties[0]?._id,
      ownerId: contacts.find((contact) => contact.role === "owner")?._id,
      tenantId: contacts.find((contact) => contact.role === "tenant")?._id,
      properties,
      contacts,
    };
  },
});
