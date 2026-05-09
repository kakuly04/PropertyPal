import { mutation, query, type MutationCtx } from "./_generated/server";

async function ensureDemoOrg(ctx: MutationCtx) {
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
}

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const orgId = await ensureDemoOrg(ctx);

    const existingTenants = await ctx.db
      .query("contacts")
      .withIndex("by_orgId_and_email", (q) =>
        q.eq("orgId", orgId).eq("email", "kakulymittal@gmail.com"),
      )
      .take(20);
    const existingTenant = existingTenants.find((contact) => contact.role === "tenant");

    const tenantId = existingTenant?._id ?? await ctx.db.insert("contacts", {
      orgId,
      name: "Kakuly Mittal",
      role: "tenant",
      phone: "+6585440809",
      whatsappNumber: "+6585440809",
      email: "kakulymittal@gmail.com",
      notes: "Demo tenant for WhatsApp maintenance flow.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const existingOwners = await ctx.db
      .query("contacts")
      .withIndex("by_orgId_and_email", (q) =>
        q.eq("orgId", orgId).eq("email", "tanvi.physics2021@gmail.com"),
      )
      .take(20);
    const existingOwner = existingOwners.find((contact) => contact.role === "owner");

    const ownerId = existingOwner?._id ?? await ctx.db.insert("contacts", {
      orgId,
      name: "Tanvi Sharma",
      role: "owner",
      phone: "+6582638075",
      whatsappNumber: "+6582638075",
      email: "tanvi.physics2021@gmail.com",
      notes: "Demo owner.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const existingPlumber = await ctx.db
      .query("contacts")
      .withIndex("by_orgId_and_phone", (q) =>
        q.eq("orgId", orgId).eq("phone", "+6582638075"),
      )
      .take(20);

    const plumber = existingPlumber.find((contact) => contact.role === "contractor" && contact.trade === "plumber");
    const plumberId = plumber?._id ?? await ctx.db.insert("contacts", {
      orgId,
      name: "Tanvi Plumbing Services",
      role: "contractor",
      phone: "+6582638075",
      whatsappNumber: "+6582638075",
      email: "tanvi.physics2021@gmail.com",
      trade: "plumber",
      companyName: "Tanvi Plumbing Services",
      notes: "Approved demo plumber.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const existingCleaner = await ctx.db
      .query("contacts")
      .withIndex("by_orgId_and_role", (q) => q.eq("orgId", orgId).eq("role", "contractor"))
      .take(100);

    const cleaner = existingCleaner.find((contact) => contact.trade === "cleaner");
    const cleanerId = cleaner?._id ?? await ctx.db.insert("contacts", {
      orgId,
      name: "Kakuly Cleaning Crew",
      role: "contractor",
      phone: "+6585440809",
      whatsappNumber: "+6585440809",
      email: "kakulymittal@gmail.com",
      trade: "cleaner",
      companyName: "Kakuly Cleaning Crew",
      notes: "Approved demo cleaner.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const electrician = existingCleaner.find((contact) => contact.trade === "electrician");
    const electricianId = electrician?._id ?? await ctx.db.insert("contacts", {
      orgId,
      name: "Demo Electrical Services",
      role: "contractor",
      phone: "+6582638075",
      whatsappNumber: "+6582638075",
      email: "tanvi.physics2021@gmail.com",
      trade: "electrician",
      companyName: "Demo Electrical Services",
      notes: "Approved demo electrician.",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const existingProperties = await ctx.db
      .query("properties")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(50);

    const property = existingProperties.find((row) => row.address === "12 Orchard Road, Singapore");
    const propertyId = property?._id ?? await ctx.db.insert("properties", {
      orgId,
      name: "Orchard Demo Apartment",
      address: "12 Orchard Road, Singapore",
      unitNo: "12-03",
      ownerId,
      tenantId,
      status: "active",
      notes: "Seeded demo property for maintenance workflow.",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId,
      actorType: "system",
      action: "demo.seeded",
      targetTable: "orgs",
      targetId: orgId,
      summary: "Demo org, property, tenant, owner, and contractors seeded.",
      metadata: { propertyId, tenantId, ownerId, plumberId, cleanerId, electricianId },
      createdAt: now,
    });

    return {
      orgId,
      propertyId,
      tenantId,
      ownerId,
      contractorIds: {
        plumberId,
        cleanerId,
        electricianId,
      },
    };
  },
});

export const getDemoContext = query({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db
      .query("orgs")
      .withIndex("by_slug", (q) => q.eq("slug", "demo"))
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
      .take(100);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_orgId", (q) => q.eq("orgId", org._id))
      .order("desc")
      .take(10);

    return {
      org,
      properties,
      contacts,
      tasks,
    };
  },
});
