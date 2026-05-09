import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const DEMO_SLUG = "demo";
const DAY = 24 * 60 * 60 * 1000;

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
    const ensureContact = async (name: string, role: "owner" | "tenant" | "contractor" | "property_manager", extra: {
      email?: string;
      phone?: string;
      whatsappNumber?: string;
      trade?: string;
      companyName?: string;
      notes?: string;
    }) => {
      const existing = contacts.find((contact) => contact.name === name && contact.role === role);
      if (existing !== undefined) {
        return existing._id;
      }
      return await ctx.db.insert("contacts", {
        orgId,
        name,
        role,
        ...extra,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    };

    const ownerId = await ensureContact("Maya Chen", "owner", {
      email: "maya.owner@example.com",
      phone: "+6560000001",
      whatsappNumber: "+6560000001",
      notes: "Demo owner for lease renewal and relisting flows.",
    });
    const tenantId = await ensureContact("Priya Menon", "tenant", {
      email: "priya.tenant@example.com",
      phone: "+6560000002",
      whatsappNumber: "+6560000002",
      notes: "Demo tenant for invoice reimbursement and lease extraction.",
    });
    const secondOwnerId = await ensureContact("Adrian Lim", "owner", {
      email: "adrian.owner@example.com",
      phone: "+6560000003",
      whatsappNumber: "+6560000003",
    });
    const secondTenantId = await ensureContact("Hafiz Rahman", "tenant", {
      email: "hafiz.tenant@example.com",
      phone: "+6560000004",
      whatsappNumber: "+6560000004",
    });
    const plumberId = await ensureContact("BrightPlumb SG", "contractor", {
      email: "plumber@example.com",
      phone: "+6560000005",
      whatsappNumber: "+6560000005",
      trade: "plumber",
      companyName: "BrightPlumb SG",
      notes: "Approved demo plumber.",
    });
    const cleanerId = await ensureContact("Prime Cleaning", "contractor", {
      email: "cleaner@example.com",
      phone: "+6560000006",
      whatsappNumber: "+6560000006",
      trade: "cleaner",
      companyName: "Prime Cleaning",
      notes: "Approved demo cleaner.",
    });

    const legacyOwner =
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
    const legacyTenant =
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
    void legacyOwner;
    void legacyTenant;

    const properties = await ctx.db
      .query("properties")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    const ensureProperty = async (address: string, unitNo: string, name: string, owner: typeof ownerId, tenant: typeof tenantId, notes: string) => {
      const existing = properties.find((property) => property.address === address && property.unitNo === unitNo);
      if (existing !== undefined) {
        return existing._id;
      }
      return await ctx.db.insert("properties", {
        orgId,
        name,
        address,
        unitNo,
        ownerId: owner,
        tenantId: tenant,
        managerMembershipId,
        status: "active",
        notes,
        createdAt: now,
        updatedAt: now,
      });
    };

    const propertyId = await ensureProperty(
      "71 Cantonment Close",
      "#12-184",
      "Cantonment Close Demo Unit",
      ownerId,
      tenantId,
      "Demo property for invoice and contract agent testing.",
    );
    const secondPropertyId = await ensureProperty(
      "18 Jervois Road",
      "#06-03",
      "Jervois Demo Apartment",
      secondOwnerId,
      secondTenantId,
      "Demo property for maintenance and reimbursement review.",
    );

    const existingLeases = await ctx.db
      .query("leases")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    let leaseId = existingLeases.find((lease) => lease.propertyId === propertyId)?._id;
    if (leaseId === undefined) {
      leaseId = await ctx.db.insert("leases", {
        orgId,
        propertyId,
        tenantId,
        startDate: "2025-07-01",
        endDate: new Date(now + 45 * DAY).toISOString().slice(0, 10),
        rentAmount: 4200,
        currency: "SGD",
        paymentFrequency: "monthly",
        depositAmount: 8400,
        extractedTenantName: "Priya Menon",
        extractedPropertyAddress: "71 Cantonment Close #12-184",
        extractionConfidence: 1,
        extractionStatus: "completed",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    let maintenanceTaskId = existingTasks.find((task) => task.title === "Kitchen sink leak")?._id;
    if (maintenanceTaskId === undefined) {
      maintenanceTaskId = await ctx.db.insert("tasks", {
        orgId,
        propertyId: secondPropertyId,
        type: "maintenance",
        status: "waiting_for_approval",
        title: "Kitchen sink leak",
        description: "Tenant reported active leak under kitchen sink. Plumber matched and waiting for approval.",
        assignedAgent: "MaintenanceAgent",
        tenantId: secondTenantId,
        ownerId: secondOwnerId,
        contractorId: plumberId,
        priority: "high",
        dueDate: new Date(now + DAY).toISOString().slice(0, 10),
        createdAt: now,
        updatedAt: now,
      });
    }

    const leaseTaskId =
      existingTasks.find((task) => task.relatedLeaseId === leaseId && task.type === "lease_renewal")?._id ??
      (await ctx.db.insert("tasks", {
        orgId,
        propertyId,
        type: "lease_renewal",
        status: "open",
        title: "Lease renewal follow-up",
        description: "Lease expires within 60 days. Confirm renewal or relisting plan with owner.",
        assignedAgent: "ContractAgent",
        tenantId,
        ownerId,
        relatedLeaseId: leaseId,
        priority: "normal",
        dueDate: new Date(now + 45 * DAY).toISOString().slice(0, 10),
        createdAt: now,
        updatedAt: now,
      }));

    const existingInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    let invoiceId = existingInvoices.find((invoice) => invoice.vendorName === "ABC Plumbing Supplies")?._id;
    if (invoiceId === undefined) {
      invoiceId = await ctx.db.insert("invoices", {
        orgId,
        propertyId: secondPropertyId,
        taskId: maintenanceTaskId,
        submittedByContactId: secondTenantId,
        vendorName: "ABC Plumbing Supplies",
        amount: 284.6,
        currency: "SGD",
        invoiceDate: "2026-05-03",
        category: "plumbing",
        paidBy: "Hafiz Rahman",
        extractionConfidence: 0.92,
        extractionStatus: "completed",
        status: "pending_approval",
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingApprovals = await ctx.db
      .query("approvals")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    const invoiceApprovalId =
      existingApprovals.find((approval) => approval.targetTable === "invoices" && approval.targetId === invoiceId)?._id ??
      (await ctx.db.insert("approvals", {
        orgId,
        requestedByAgent: "InvoiceAgent",
        actionType: "approve_invoice_reimbursement",
        targetTable: "invoices",
        targetId: invoiceId,
        summary: "Approve SGD 284.60 reimbursement for ABC Plumbing Supplies.",
        details: "OCR extracted vendor, amount, date, and plumbing category with high confidence.",
        status: "pending",
        expiresAt: now + 2 * DAY,
        createdAt: now,
        updatedAt: now,
      }));

    const existingFiles = await ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    const receiptFileId =
      existingFiles.find((file) => file.originalName === "demo_receipt.png")?._id ??
      (await ctx.db.insert("files", {
        orgId,
        propertyId: secondPropertyId,
        taskId: maintenanceTaskId,
        storageId: "external:https://worktrek.com/wp-content/uploads/2026/01/image1-1.png",
        externalUrl: "https://worktrek.com/wp-content/uploads/2026/01/image1-1.png",
        originalName: "demo_receipt.png",
        contentType: "image/png",
        purpose: "invoice_receipt",
        status: "ready",
        createdAt: now,
        updatedAt: now,
      }));
    const leaseFileId =
      existingFiles.find((file) => file.originalName === "sample_fake_lease_agreement_ocr_test.pdf")?._id ??
      (await ctx.db.insert("files", {
        orgId,
        propertyId,
        storageId: "external:sample_fake_lease_agreement_ocr_test.pdf",
        originalName: "sample_fake_lease_agreement_ocr_test.pdf",
        contentType: "application/pdf",
        purpose: "lease_pdf",
        status: "ready",
        createdAt: now,
        updatedAt: now,
      }));

    const existingRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    if (!existingRuns.some((run) => run.eventId === "demo-contract-extraction")) {
      await ctx.db.insert("agentRuns", {
        orgId,
        agentName: "ContractAgent",
        eventId: "demo-contract-extraction",
        source: "upload",
        inputSummary: "Lease PDF uploaded for extraction.",
        outputSummary: "Extracted lease dates, rent amount, tenant name, and address.",
        status: "completed",
        startedAt: now - 40 * 60 * 1000,
        completedAt: now - 38 * 60 * 1000,
        createdAt: now - 40 * 60 * 1000,
        updatedAt: now - 38 * 60 * 1000,
      });
    }
    if (!existingRuns.some((run) => run.eventId === "demo-invoice-ocr")) {
      await ctx.db.insert("agentRuns", {
        orgId,
        agentName: "InvoiceAgent",
        eventId: "demo-invoice-ocr",
        source: "upload",
        inputSummary: "Tenant submitted receipt image for reimbursement.",
        outputSummary: "Created reimbursement approval from OCR result.",
        status: "waiting_for_approval",
        startedAt: now - 25 * 60 * 1000,
        createdAt: now - 25 * 60 * 1000,
        updatedAt: now - 24 * 60 * 1000,
      });
    }

    const existingAgentTasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    if (!existingAgentTasks.some((task) => task.type === "schedule_lease_renewal_meeting")) {
      await ctx.db.insert("agentTasks", {
        orgId,
        assignedAgent: "CommsAgent",
        eventId: `demo-renewal-meeting:${leaseId}`,
        source: "cron",
        type: "schedule_lease_renewal_meeting",
        status: "queued",
        propertyId,
        taskId: leaseTaskId,
        payload: {
          leaseId,
          ownerContactId: ownerId,
          tenantContactId: tenantId,
          leaseEndDate: new Date(now + 45 * DAY).toISOString().slice(0, 10),
          summary: "Schedule a renewal discussion between owner and property manager.",
        },
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    const existingConversations = await ctx.db
      .query("conversations")
      .withIndex("by_orgId", (q) => q.eq("orgId", orgId))
      .take(100);
    if (!existingConversations.some((conversation) => conversation.subject === "Lease renewal scheduling")) {
      const conversationId = await ctx.db.insert("conversations", {
        orgId,
        channel: "email",
        subject: "Lease renewal scheduling",
        propertyId,
        taskId: leaseTaskId,
        primaryContactId: ownerId,
        status: "waiting",
        lastMessageAt: now - 8 * 60 * 1000,
        createdAt: now - 12 * 60 * 1000,
        updatedAt: now - 8 * 60 * 1000,
      });
      await ctx.db.insert("messages", {
        orgId,
        conversationId,
        direction: "outbound",
        channel: "email",
        recipientContactId: ownerId,
        body: "Could you share two preferred slots for the lease renewal discussion?",
        deliveryStatus: "sent",
        sentAt: now - 8 * 60 * 1000,
        createdAt: now - 8 * 60 * 1000,
      });
    }

    await ctx.db.insert("auditLogs", {
      orgId,
      actorType: "system",
      action: "demo.seeded",
      targetTable: "orgs",
      targetId: orgId,
      summary: "Demo org, contacts, properties, lease, invoice, approvals, files, and conversations are ready.",
      metadata: { propertyId, secondPropertyId, leaseId, invoiceId, invoiceApprovalId, receiptFileId, leaseFileId, cleanerId },
      createdAt: now,
    });

    return {
      orgId,
      managerMembershipId,
      ownerId,
      tenantId,
      propertyId,
      secondPropertyId,
      secondTenantId,
      secondOwnerId,
      plumberId,
      cleanerId,
      leaseId,
      leaseTaskId,
      invoiceId,
      invoiceApprovalId,
      receiptFileId,
      leaseFileId,
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
    const tasks = await ctx.db
      .query("tasks")
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
      tasks,
    };
  },
});
