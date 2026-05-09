import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const leaseExtractionStatus = v.union(
  v.literal("not_started"),
  v.literal("extracting"),
  v.literal("needs_review"),
  v.literal("completed"),
  v.literal("failed"),
);

const paymentFrequency = v.union(
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("yearly"),
  v.literal("unknown"),
);

export const createLeaseFromPdf = mutation({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    tenantId: v.optional(v.id("contacts")),
    leaseFileId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const leaseId = await ctx.db.insert("leases", {
      ...args,
      extractionStatus: "not_started",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: args.orgId,
      actorType: "system",
      action: "lease.created",
      targetTable: "leases",
      targetId: leaseId,
      summary: "Lease record created from PDF upload.",
      createdAt: now,
    });

    return leaseId;
  },
});

export const updateLeaseExtraction = mutation({
  args: {
    leaseId: v.id("leases"),
    tenantId: v.optional(v.id("contacts")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    rentAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    paymentFrequency: v.optional(paymentFrequency),
    depositAmount: v.optional(v.number()),
    extractedTenantName: v.optional(v.string()),
    extractedPropertyAddress: v.optional(v.string()),
    extractionConfidence: v.optional(v.number()),
    extractionStatus: leaseExtractionStatus,
  },
  handler: async (ctx, args) => {
    const { leaseId, ...updates } = args;
    const lease = await ctx.db.get(leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const now = Date.now();

    await ctx.db.patch(leaseId, {
      ...updates,
      status: updates.extractionStatus === "failed" ? "draft" : lease.status,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: "agent",
      actorId: "ContractAgent",
      action: "lease.extraction_updated",
      targetTable: "leases",
      targetId: leaseId,
      summary: `Lease extraction status changed to ${updates.extractionStatus}.`,
      metadata: {
        extractionConfidence: updates.extractionConfidence,
      },
      createdAt: now,
    });

    return leaseId;
  },
});

export const submitLeaseExtractionForReview = mutation({
  args: {
    leaseId: v.id("leases"),
    requestedByRunId: v.optional(v.id("agentRuns")),
    summary: v.optional(v.string()),
    details: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db.get(args.leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.leaseId, {
      extractionStatus: "needs_review",
      updatedAt: now,
    });

    const approvalId = await ctx.db.insert("approvals", {
      orgId: lease.orgId,
      requestedByAgent: "ContractAgent",
      requestedByRunId: args.requestedByRunId,
      actionType: "confirm_lease_extraction",
      targetTable: "leases",
      targetId: args.leaseId,
      summary: args.summary ?? "Confirm extracted lease details.",
      details: args.details,
      status: "pending",
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: "agent",
      actorId: "ContractAgent",
      action: "lease.submitted_for_review",
      targetTable: "leases",
      targetId: args.leaseId,
      summary: "Lease extraction submitted for manager review.",
      metadata: { approvalId },
      createdAt: now,
    });

    return { leaseId: args.leaseId, approvalId };
  },
});

export const confirmLeaseExtraction = mutation({
  args: {
    leaseId: v.id("leases"),
    approvalId: v.optional(v.id("approvals")),
    decidedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db.get(args.leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.leaseId, {
      extractionStatus: "completed",
      status: "active",
      updatedAt: now,
    });

    if (args.approvalId !== undefined) {
      await ctx.db.patch(args.approvalId, {
        status: "approved",
        decidedByMembershipId: args.decidedByMembershipId,
        decidedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: args.decidedByMembershipId === undefined ? "system" : "user",
      actorId: args.decidedByMembershipId,
      action: "lease.extraction_confirmed",
      targetTable: "leases",
      targetId: args.leaseId,
      summary: "Lease extraction confirmed.",
      createdAt: now,
    });

    return args.leaseId;
  },
});

export const getLease = query({
  args: {
    leaseId: v.id("leases"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leaseId);
  },
});

export const listLeasesByOrg = query({
  args: {
    orgId: v.id("orgs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leases")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listLeasesByProperty = query({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leases")
      .withIndex("by_orgId_and_propertyId", (q) =>
        q.eq("orgId", args.orgId).eq("propertyId", args.propertyId),
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const listExpiringLeases = query({
  args: {
    orgId: v.id("orgs"),
    endDateOnOrBefore: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leases")
      .withIndex("by_orgId_and_endDate", (q) =>
        q.eq("orgId", args.orgId).lte("endDate", args.endDateOnOrBefore),
      )
      .take(args.limit ?? 100);
  },
});

export const createLeaseExpiryTasks = mutation({
  args: {
    orgId: v.id("orgs"),
    endDateOnOrBefore: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const leases = await ctx.db
      .query("leases")
      .withIndex("by_orgId_and_endDate", (q) =>
        q.eq("orgId", args.orgId).lte("endDate", args.endDateOnOrBefore),
      )
      .take(args.limit ?? 100);

    const existingRenewalTasks = await ctx.db
      .query("tasks")
      .withIndex("by_orgId_and_type", (q) =>
        q.eq("orgId", args.orgId).eq("type", "lease_renewal"),
      )
      .take(500);
    const existingLeaseIds = new Set(
      existingRenewalTasks
        .map((task) => task.relatedLeaseId)
        .filter((leaseId): leaseId is NonNullable<typeof leaseId> => leaseId !== undefined),
    );

    const created: Array<{ leaseId: string; taskId: string; agentTaskId: string }> = [];

    for (const lease of leases) {
      if (lease.status !== "active" || lease.endDate === undefined || existingLeaseIds.has(lease._id)) {
        continue;
      }

      const taskId = await ctx.db.insert("tasks", {
        orgId: lease.orgId,
        propertyId: lease.propertyId,
        type: "lease_renewal",
        status: "open",
        title: "Lease renewal follow-up",
        description: `Lease expires on ${lease.endDate}. Confirm renewal or relisting plan with the owner.`,
        assignedAgent: "ContractAgent",
        tenantId: lease.tenantId,
        relatedLeaseId: lease._id,
        priority: "normal",
        dueDate: lease.endDate,
        createdAt: now,
        updatedAt: now,
      });

      const agentTaskId = await ctx.db.insert("agentTasks", {
        orgId: lease.orgId,
        assignedAgent: "ContractAgent",
        eventId: `lease-expiring:${lease._id}:${now}`,
        source: "cron",
        type: "lease_expiry_workflow",
        status: "queued",
        propertyId: lease.propertyId,
        taskId,
        payload: {
          leaseId: lease._id,
          endDate: lease.endDate,
          renewalWindowEndDate: args.endDateOnOrBefore,
        },
        attempts: 0,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.patch(lease._id, {
        status: "expiring",
        updatedAt: now,
      });

      await ctx.db.insert("auditLogs", {
        orgId: lease.orgId,
        actorType: "system",
        action: "lease.expiry_task_created",
        targetTable: "leases",
        targetId: lease._id,
        summary: "Created lease expiry workflow task.",
        metadata: { taskId, agentTaskId },
        createdAt: now,
      });

      created.push({ leaseId: lease._id, taskId, agentTaskId });
    }

    return created;
  },
});

export const createLeaseExpiryTasksForAllOrgs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const windowEnd = new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const orgs = await ctx.db.query("orgs").take(100);
    const results: Array<{ orgId: string; leaseId: string; taskId: string; agentTaskId: string }> = [];

    for (const org of orgs) {
      const leases = await ctx.db
        .query("leases")
        .withIndex("by_orgId_and_endDate", (q) =>
          q.eq("orgId", org._id).lte("endDate", windowEnd),
        )
        .take(100);

      const existingRenewalTasks = await ctx.db
        .query("tasks")
        .withIndex("by_orgId_and_type", (q) =>
          q.eq("orgId", org._id).eq("type", "lease_renewal"),
        )
        .take(500);
      const existingLeaseIds = new Set(
        existingRenewalTasks
          .map((task) => task.relatedLeaseId)
          .filter((leaseId): leaseId is NonNullable<typeof leaseId> => leaseId !== undefined),
      );

      for (const lease of leases) {
        if (lease.status !== "active" || lease.endDate === undefined || existingLeaseIds.has(lease._id)) {
          continue;
        }

        const taskId = await ctx.db.insert("tasks", {
          orgId: lease.orgId,
          propertyId: lease.propertyId,
          type: "lease_renewal",
          status: "open",
          title: "Lease renewal follow-up",
          description: `Lease expires on ${lease.endDate}. Confirm renewal or relisting plan with the owner.`,
          assignedAgent: "ContractAgent",
          tenantId: lease.tenantId,
          relatedLeaseId: lease._id,
          priority: "normal",
          dueDate: lease.endDate,
          createdAt: now,
          updatedAt: now,
        });

        const agentTaskId = await ctx.db.insert("agentTasks", {
          orgId: lease.orgId,
          assignedAgent: "ContractAgent",
          eventId: `lease-expiring:${lease._id}:${now}`,
          source: "cron",
          type: "lease_expiry_workflow",
          status: "queued",
          propertyId: lease.propertyId,
          taskId,
          payload: {
            leaseId: lease._id,
            endDate: lease.endDate,
            renewalWindowEndDate: windowEnd,
          },
          attempts: 0,
          createdAt: now,
          updatedAt: now,
        });

        await ctx.db.patch(lease._id, {
          status: "expiring",
          updatedAt: now,
        });

        await ctx.db.insert("auditLogs", {
          orgId: lease.orgId,
          actorType: "system",
          action: "lease.expiry_task_created",
          targetTable: "leases",
          targetId: lease._id,
          summary: "Created lease expiry workflow task from daily scheduled check.",
          metadata: { taskId, agentTaskId, windowEnd },
          createdAt: now,
        });

        results.push({ orgId: org._id, leaseId: lease._id, taskId, agentTaskId });
      }
    }

    return results;
  },
});

export const queueRenewalMeetingRequest = mutation({
  args: {
    leaseId: v.id("leases"),
    taskId: v.optional(v.id("tasks")),
    requestedByRunId: v.optional(v.id("agentRuns")),
    meetingSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db.get(args.leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const property = await ctx.db.get(lease.propertyId);
    const now = Date.now();

    const commsTaskId = await ctx.db.insert("agentTasks", {
      orgId: lease.orgId,
      assignedAgent: "CommsAgent",
      eventId: `lease-renewal-meeting:${args.leaseId}:${now}`,
      source: "cron",
      type: "schedule_lease_renewal_meeting",
      status: "queued",
      propertyId: lease.propertyId,
      taskId: args.taskId,
      payload: {
        leaseId: args.leaseId,
        ownerContactId: property?.ownerId,
        managerMembershipId: property?.managerMembershipId,
        tenantContactId: lease.tenantId,
        leaseEndDate: lease.endDate,
        summary:
          args.meetingSummary ??
          "Schedule a renewal discussion between the property manager and owner.",
      },
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: "agent",
      actorId: "ContractAgent",
      agentRunId: args.requestedByRunId,
      action: "lease.renewal_meeting_requested",
      targetTable: "leases",
      targetId: args.leaseId,
      summary: "Queued CommsAgent task to schedule lease renewal meeting.",
      metadata: { commsTaskId },
      createdAt: now,
    });

    return { leaseId: args.leaseId, commsTaskId };
  },
});

export const createRelistingDraft = mutation({
  args: {
    leaseId: v.id("leases"),
    taskId: v.optional(v.id("tasks")),
    requestedByRunId: v.optional(v.id("agentRuns")),
    newRentAmount: v.number(),
    currency: v.optional(v.string()),
    availableFrom: v.optional(v.string()),
    photoFileIds: v.optional(v.array(v.id("files"))),
    headline: v.optional(v.string()),
    bedrooms: v.optional(v.number()),
    bathrooms: v.optional(v.number()),
    floorArea: v.optional(v.number()),
    furnishing: v.optional(v.string()),
    listingDescription: v.optional(v.string()),
    additionalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db.get(args.leaseId);

    if (lease === null) {
      throw new Error("Lease not found.");
    }

    const property = await ctx.db.get(lease.propertyId);
    if (property === null) {
      throw new Error("Property not found.");
    }

    const now = Date.now();
    const currency = args.currency ?? lease.currency ?? "SGD";
    const address = lease.extractedPropertyAddress ?? property.address;
    const headline = args.headline ?? `For rent: ${property.name ?? address}`;
    const details = [
      args.bedrooms !== undefined ? `${args.bedrooms} bed` : null,
      args.bathrooms !== undefined ? `${args.bathrooms} bath` : null,
      args.floorArea !== undefined ? `${args.floorArea} sqft` : null,
      args.furnishing,
    ].filter((item): item is string => item !== null && item !== undefined && item !== "");
    const description =
      args.listingDescription ??
      [
        `${headline}.`,
        `Available for rent at ${currency} ${args.newRentAmount.toLocaleString()} per month.`,
        args.availableFrom !== undefined ? `Available from ${args.availableFrom}.` : null,
        args.additionalNotes,
      ]
        .filter((item): item is string => item !== null && item !== undefined && item !== "")
        .join("\n\n");
    const fullListing = [
      headline,
      address,
      `For Rent - ${currency} ${args.newRentAmount.toLocaleString()} / month`,
      args.availableFrom !== undefined ? `Available from: ${args.availableFrom}` : null,
      details.length > 0 ? `Details: ${details.join(" | ")}` : null,
      description,
    ]
      .filter((item): item is string => item !== null)
      .join("\n\n");
    const taskId =
      args.taskId ??
      (await ctx.db.insert("tasks", {
        orgId: lease.orgId,
        propertyId: lease.propertyId,
        type: "relisting",
        status: "waiting_for_approval",
        title: "Review relisting draft",
        description: "Review the copyable relisting draft before manually listing the property.",
        assignedAgent: "ContractAgent",
        tenantId: lease.tenantId,
        relatedLeaseId: lease._id,
        priority: "high",
        createdAt: now,
        updatedAt: now,
      }));

    const relistingDraftId = await ctx.db.insert("relistingDrafts", {
      orgId: lease.orgId,
      leaseId: args.leaseId,
      propertyId: lease.propertyId,
      taskId,
      requestedByRunId: args.requestedByRunId,
      status: "draft",
      headline,
      address,
      listingType: "for_rent",
      rentAmount: args.newRentAmount,
      currency,
      availableFrom: args.availableFrom,
      bedrooms: args.bedrooms,
      bathrooms: args.bathrooms,
      floorArea: args.floorArea,
      furnishing: args.furnishing,
      description,
      additionalNotes: args.additionalNotes,
      photoFileIds: args.photoFileIds,
      copyFields: {
        headline,
        address,
        listingType: "For Rent",
        rent: `${currency} ${args.newRentAmount.toLocaleString()} / month`,
        availability: args.availableFrom,
        details: details.join(" | "),
        description,
        fullListing,
      },
      createdAt: now,
      updatedAt: now,
    });

    const approvalId = await ctx.db.insert("approvals", {
      orgId: lease.orgId,
      requestedByAgent: "ContractAgent",
      requestedByRunId: args.requestedByRunId,
      actionType: "approve_relisting",
      targetTable: "relistingDrafts",
      targetId: relistingDraftId,
      summary: `Approve copyable relisting draft at ${currency} ${args.newRentAmount}.`,
      details: JSON.stringify({
        leaseId: args.leaseId,
        relistingDraftId,
        newRentAmount: args.newRentAmount,
        currency,
        availableFrom: args.availableFrom,
        photoFileIds: args.photoFileIds ?? [],
        headline,
        listingDescription: description,
      }),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(relistingDraftId, {
      approvalId,
      status: "pending_approval",
      updatedAt: now,
    });

    await ctx.db.patch(taskId, {
      status: "waiting_for_approval",
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      orgId: lease.orgId,
      actorType: "agent",
      actorId: "ContractAgent",
      agentRunId: args.requestedByRunId,
      action: "lease.relisting_approval_created",
      targetTable: "relistingDrafts",
      targetId: relistingDraftId,
      summary: "Created approval request for copyable relisting draft.",
      metadata: { approvalId, leaseId: args.leaseId, taskId },
      createdAt: now,
    });

    return { leaseId: args.leaseId, taskId, approvalId, relistingDraftId };
  },
});

export const approveRelistingDraft = mutation({
  args: {
    relistingDraftId: v.id("relistingDrafts"),
    approvalId: v.optional(v.id("approvals")),
    decidedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.relistingDraftId);

    if (draft === null) {
      throw new Error("Relisting draft not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.relistingDraftId, {
      status: "approved",
      updatedAt: now,
    });

    if (args.approvalId !== undefined) {
      await ctx.db.patch(args.approvalId, {
        status: "approved",
        decidedByMembershipId: args.decidedByMembershipId,
        decidedAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      orgId: draft.orgId,
      actorType: args.decidedByMembershipId === undefined ? "system" : "user",
      actorId: args.decidedByMembershipId,
      action: "relisting_draft.approved",
      targetTable: "relistingDrafts",
      targetId: args.relistingDraftId,
      summary: "Relisting draft approved for manual PropertyGuru entry.",
      metadata: {
        leaseId: draft.leaseId,
        taskId: draft.taskId,
      },
      createdAt: now,
    });

    return args.relistingDraftId;
  },
});

export const markRelistingManuallyListed = mutation({
  args: {
    relistingDraftId: v.id("relistingDrafts"),
    manuallyListedByMembershipId: v.optional(v.id("memberships")),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.relistingDraftId);

    if (draft === null) {
      throw new Error("Relisting draft not found.");
    }

    const now = Date.now();

    await ctx.db.patch(args.relistingDraftId, {
      status: "manually_listed",
      manuallyListedAt: now,
      manuallyListedByMembershipId: args.manuallyListedByMembershipId,
      updatedAt: now,
    });

    if (draft.taskId !== undefined) {
      await ctx.db.patch(draft.taskId, {
        status: "done",
        notes: "Property agent manually listed this draft on PropertyGuru.",
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      orgId: draft.orgId,
      actorType: args.manuallyListedByMembershipId === undefined ? "system" : "user",
      actorId: args.manuallyListedByMembershipId,
      action: "relisting_draft.manually_listed",
      targetTable: "relistingDrafts",
      targetId: args.relistingDraftId,
      summary: "Property agent marked relisting draft as manually listed.",
      metadata: {
        leaseId: draft.leaseId,
        taskId: draft.taskId,
      },
      createdAt: now,
    });

    return args.relistingDraftId;
  },
});

export const getRelistingDraft = query({
  args: {
    relistingDraftId: v.id("relistingDrafts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.relistingDraftId);
  },
});

export const listRelistingDraftsByProperty = query({
  args: {
    orgId: v.id("orgs"),
    propertyId: v.id("properties"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("relistingDrafts")
      .withIndex("by_orgId_and_propertyId", (q) =>
        q.eq("orgId", args.orgId).eq("propertyId", args.propertyId),
      )
      .order("desc")
      .take(args.limit ?? 50);
  },
});
