import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const channel = v.union(
  v.literal("whatsapp"),
  v.literal("email"),
  v.literal("voice"),
  v.literal("dashboard"),
);

const conversationStatus = v.union(v.literal("open"), v.literal("waiting"), v.literal("closed"));
const direction = v.union(v.literal("inbound"), v.literal("outbound"));

const deliveryStatus = v.union(
  v.literal("queued"),
  v.literal("sent"),
  v.literal("delivered"),
  v.literal("read"),
  v.literal("failed"),
  v.literal("received"),
);

export const createConversation = mutation({
  args: {
    orgId: v.id("orgs"),
    channel,
    subject: v.optional(v.string()),
    propertyId: v.optional(v.id("properties")),
    taskId: v.optional(v.id("tasks")),
    primaryContactId: v.optional(v.id("contacts")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("conversations", {
      ...args,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    orgId: v.id("orgs"),
    conversationId: v.id("conversations"),
    direction,
    channel,
    body: v.string(),
    senderContactId: v.optional(v.id("contacts")),
    recipientContactId: v.optional(v.id("contacts")),
    agentRunId: v.optional(v.id("agentRuns")),
    externalMessageId: v.optional(v.string()),
    deliveryStatus: v.optional(deliveryStatus),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const status = args.deliveryStatus ?? (args.direction === "inbound" ? "received" : "queued");

    const messageId = await ctx.db.insert("messages", {
      ...args,
      deliveryStatus: status,
      sentAt: args.direction === "outbound" ? now : undefined,
      receivedAt: args.direction === "inbound" ? now : undefined,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      status: args.direction === "outbound" ? "waiting" : "open",
      lastMessageAt: now,
      updatedAt: now,
    });

    return messageId;
  },
});

export const markMessageDelivery = mutation({
  args: {
    messageId: v.id("messages"),
    deliveryStatus,
    externalMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      deliveryStatus: args.deliveryStatus,
      externalMessageId: args.externalMessageId,
    });

    return args.messageId;
  },
});

export const markMessageDeliveryByExternalId = mutation({
  args: {
    orgId: v.id("orgs"),
    externalMessageId: v.string(),
    deliveryStatus,
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(100);

    const message = messages.find((row) => row.externalMessageId === args.externalMessageId);

    if (message === undefined) {
      return null;
    }

    await ctx.db.patch(message._id, {
      deliveryStatus: args.deliveryStatus,
    });

    return message._id;
  },
});

export const updateConversationStatus = mutation({
  args: {
    conversationId: v.id("conversations"),
    status: conversationStatus,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.conversationId;
  },
});

export const listConversations = query({
  args: {
    orgId: v.id("orgs"),
    channel: v.optional(channel),
    status: v.optional(conversationStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      return await ctx.db
        .query("conversations")
        .withIndex("by_orgId_and_status", (q) => q.eq("orgId", args.orgId).eq("status", args.status!))
        .order("desc")
        .take(args.limit ?? 50);
    }

    if (args.channel !== undefined) {
      return await ctx.db
        .query("conversations")
        .withIndex("by_orgId_and_channel", (q) => q.eq("orgId", args.orgId).eq("channel", args.channel!))
        .order("desc")
        .take(args.limit ?? 50);
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listMessagesForConversation = query({
  args: {
    orgId: v.id("orgs"),
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_orgId_and_conversationId", (q) =>
        q.eq("orgId", args.orgId).eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(args.limit ?? 100);
  },
});
