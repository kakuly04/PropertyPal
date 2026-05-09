import { mutation, query } from "./_generated/server";

export const ensureDemoOrg = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("orgs")
      .withIndex("by_slug", (q) => q.eq("slug", "demo"))
      .unique();

    if (existing !== null) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("orgs", {
      name: "KeyAgent Demo",
      slug: "demo",
      timezone: "Asia/Singapore",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getFirstOrg = query({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("orgs").take(1);
    return orgs[0] ?? null;
  },
});
