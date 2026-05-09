import { httpRouter } from "convex/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";

const http = httpRouter();

function isAuthorized(req: Request) {
  const expected = process.env.KEYAGENT_WEBHOOK_SECRET;

  if (!expected) {
    return true;
  }

  return req.headers.get("x-keyagent-secret") === expected;
}

async function readJson(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function objectBody(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected a JSON object body.");
  }

  return value as Record<string, unknown>;
}

function stringField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected string field: ${key}.`);
  }

  return value;
}

function optionalStringField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Expected optional string field: ${key}.`);
  }

  return value;
}

function optionalNumberField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number") {
    throw new Error(`Expected optional number field: ${key}.`);
  }

  return value;
}

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => {
    return Response.json({ ok: true, service: "keyagent-convex" });
  }),
});

http.route({
  path: "/agent-tools/seed-demo-data",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await ctx.runMutation(api.demoSeed.ensureDemoData, {});
    return Response.json({ ok: true, result });
  }),
});

http.route({
  path: "/agent-tools/get-demo-context",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let context = await ctx.runQuery(api.demoSeed.getDemoData, {});

    if (context === null) {
      await ctx.runMutation(api.demoSeed.ensureDemoData, {});
      context = await ctx.runQuery(api.demoSeed.getDemoData, {});
    }

    return Response.json({ ok: true, context });
  }),
});

http.route({
  path: "/agent-tools/lookup-contractors-by-trade",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = objectBody(await readJson(req));
    const requestedOrgId = stringField(body, "orgId");
    const orgId = requestedOrgId === "1" || requestedOrgId === "demo"
      ? await ctx.runMutation(api.orgs.ensureDemoOrg, {})
      : requestedOrgId as Id<"orgs">;
    const contractors = await ctx.runQuery(api.contacts.lookupContractorsByTrade, {
      orgId,
      trade: stringField(body, "trade"),
      limit: optionalNumberField(body, "limit"),
    });
    return Response.json({ ok: true, contractors });
  }),
});

http.route({
  path: "/agent-tools/create-maintenance-task",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = objectBody(await readJson(req));
    const requestedOrgId = stringField(body, "orgId");
    const orgId = requestedOrgId === "1" || requestedOrgId === "demo"
      ? await ctx.runMutation(api.orgs.ensureDemoOrg, {})
      : requestedOrgId as Id<"orgs">;
    const taskId = await ctx.runMutation(api.tasks.createMaintenanceTask, {
      orgId,
      propertyId: stringField(body, "propertyId") as Id<"properties">,
      title: stringField(body, "title"),
      description: stringField(body, "description"),
      tenantId: optionalStringField(body, "tenantId") as Id<"contacts"> | undefined,
      ownerId: optionalStringField(body, "ownerId") as Id<"contacts"> | undefined,
      priority: optionalStringField(body, "priority") as "low" | "normal" | "high" | "urgent" | undefined,
      dueDate: optionalStringField(body, "dueDate"),
      notes: optionalStringField(body, "notes"),
    });
    return Response.json({ ok: true, taskId });
  }),
});

http.route({
  path: "/agent-tools/record-agent-result",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = objectBody(await readJson(req));
    const agentName = stringField(body, "agentName") as
      | "MaintenanceAgent"
      | "ContractAgent"
      | "InvoiceAgent"
      | "CommsAgent"
      | "OrchestratorAgent";
    const source = stringField(body, "source") as "dashboard" | "whatsapp" | "email" | "cron" | "upload";
    const requestedOrgId = stringField(body, "orgId");
    const orgId = requestedOrgId === "1" || requestedOrgId === "demo"
      ? await ctx.runMutation(api.orgs.ensureDemoOrg, {})
      : requestedOrgId as Id<"orgs">;

    const agentRunId = await ctx.runMutation(api.agentRuns.startAgentRun, {
      orgId,
      agentName,
      eventId: stringField(body, "eventId"),
      source,
      inputSummary: stringField(body, "inputSummary"),
    });

    await ctx.runMutation(api.agentRuns.completeAgentRun, {
      agentRunId,
      outputSummary: stringField(body, "outputSummary"),
    });

    return Response.json({ ok: true, agentRunId });
  }),
});

http.route({
  path: "/agent-tools/record-inbound-whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = objectBody(await readJson(req));
    const requestedOrgId = stringField(body, "orgId");
    const orgId = requestedOrgId === "1" || requestedOrgId === "demo"
      ? await ctx.runMutation(api.orgs.ensureDemoOrg, {})
      : requestedOrgId as Id<"orgs">;
    const from = stringField(body, "from");
    const to = stringField(body, "to");
    const messageBody = stringField(body, "body");
    const messageSid = optionalStringField(body, "messageSid");
    const now = Date.now();

    const conversationId = await ctx.runMutation(api.conversations.createConversation, {
      orgId,
      channel: "whatsapp",
      subject: `WhatsApp from ${from}`,
    });

    const messageId = await ctx.runMutation(api.conversations.addMessage, {
      orgId,
      conversationId,
      direction: "inbound",
      channel: "whatsapp",
      body: messageBody,
      externalMessageId: messageSid,
      deliveryStatus: "received",
    });

    const agentTaskId = await ctx.runMutation(api.agentTasks.enqueueAgentTask, {
      orgId,
      assignedAgent: "OrchestratorAgent",
      eventId: messageSid ?? `whatsapp-${now}`,
      source: "whatsapp",
      type: "inbound_whatsapp",
      payload: {
        from,
        to,
        body: messageBody,
        messageSid,
        conversationId,
        messageId,
      },
    });

    return Response.json({ ok: true, conversationId, messageId, agentTaskId });
  }),
});

http.route({
  path: "/agent-tools/record-whatsapp-status",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!isAuthorized(req)) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = objectBody(await readJson(req));
    const requestedOrgId = stringField(body, "orgId");
    const orgId = requestedOrgId === "1" || requestedOrgId === "demo"
      ? await ctx.runMutation(api.orgs.ensureDemoOrg, {})
      : requestedOrgId as Id<"orgs">;
    const messageSid = stringField(body, "messageSid");
    const status = stringField(body, "status");
    const mappedStatus = status === "delivered"
      ? "delivered"
      : status === "read"
        ? "read"
        : status === "failed" || status === "undelivered"
          ? "failed"
          : status === "sent"
            ? "sent"
            : "queued";

    const messageId = await ctx.runMutation(api.conversations.markMessageDeliveryByExternalId, {
      orgId,
      externalMessageId: messageSid,
      deliveryStatus: mappedStatus,
    });

    return Response.json({ ok: true, messageId });
  }),
});

export default http;
