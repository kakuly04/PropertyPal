import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const filePurpose = v.union(
  v.literal("lease_pdf"),
  v.literal("invoice_receipt"),
  v.literal("listing_photo"),
  v.literal("maintenance_photo"),
  v.literal("other"),
);

export const createFileRecord = mutation({
  args: {
    orgId: v.id("orgs"),
    storageId: v.string(),
    externalUrl: v.optional(v.string()),
    uploadedByMembershipId: v.optional(v.id("memberships")),
    propertyId: v.optional(v.id("properties")),
    taskId: v.optional(v.id("tasks")),
    originalName: v.string(),
    contentType: v.string(),
    sizeBytes: v.optional(v.number()),
    purpose: filePurpose,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("files", {
      ...args,
      status: "uploaded",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const markFileProcessing = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      status: "processing",
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

export const markFileReady = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      status: "ready",
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

export const markFileFailed = mutation({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId, {
      status: "failed",
      updatedAt: Date.now(),
    });

    return args.fileId;
  },
});

export const getFile = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId);
  },
});

export const listFilesForProperty = query({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_orgId_and_propertyId", (q) =>
        q.eq("orgId", args.orgId).eq("propertyId", args.propertyId),
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});
