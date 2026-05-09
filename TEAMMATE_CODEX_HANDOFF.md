# KeyAgent Teammate Codex Handoff

## Current State

This repo contains the `keyagent/` Next.js app with Convex initialized.

The shared Convex schema has already been expanded in:

```text
keyagent/convex/schema.ts
```

The schema now includes shared multi-agent tables:

```text
orgs
memberships
files
approvals
agentRuns
auditLogs
agentTasks
conversations
messages
contacts
properties
leases
tasks
invoices
```

Tanvi's side has already added Convex foundation modules for invoice and contract workflows:

```text
keyagent/convex/files.ts
keyagent/convex/invoices.ts
keyagent/convex/leases.ts
keyagent/convex/approvals.ts
keyagent/convex/agentRuns.ts
keyagent/convex/auditLogs.ts
```

These functions cover receipt/lease file metadata, invoice creation, invoice extraction updates, approval submission, reimbursement, lease extraction updates, lease review, agent run logging, and audit logs.

## Ownership Split

Tanvi owns:

```text
keyagent/convex/invoices.ts
keyagent/convex/leases.ts
keyagent/convex/files.ts
keyagent/convex/approvals.ts
keyagent/convex/agentRuns.ts
keyagent/convex/auditLogs.ts
future InvoiceAgent files
future ContractAgent files
```

Teammate owns:

```text
keyagent/convex/messages.ts
keyagent/convex/conversations.ts
keyagent/convex/agentTasks.ts
keyagent/convex/maintenance.ts
future CommsAgent files
future MaintenanceAgent files
```

Coordinate before editing:

```text
keyagent/convex/schema.ts
keyagent/package.json
keyagent/package-lock.json
keyagent/app/layout.tsx
keyagent/app/globals.css
requirements.txt
CONTEXT.md
```

## What Teammate Should Build Next

Start with Convex functions for comms and maintenance. Do not start with the orchestrator yet.

Create:

```text
keyagent/convex/conversations.ts
keyagent/convex/messages.ts
keyagent/convex/agentTasks.ts
keyagent/convex/maintenance.ts
```

Recommended functions:

```text
conversations.ts
- createConversation
- getConversation
- listConversationsByOrg
- listConversationsByProperty
- markConversationWaiting
- closeConversation

messages.ts
- createInboundMessage
- createOutboundMessage
- updateDeliveryStatus
- listMessagesForConversation

agentTasks.ts
- createAgentTask
- claimAgentTask
- completeAgentTask
- failAgentTask
- listQueuedTasksForAgent

maintenance.ts
- createMaintenanceTask
- assignContractor
- markMaintenanceInProgress
- markPendingVerification
- markMaintenanceDone
- listMaintenanceTasksByProperty
```

## Integration Rules

Do not send WhatsApp/email directly from invoice, contract, or maintenance functions. Comms should own external messages.

When another agent needs communication, represent that as either:

```text
agentTasks row assigned to CommsAgent
```

or a conversation/message record that CommsAgent processes.

Sensitive actions must go through `approvals`, not direct side effects.

Use `auditLogs` for business-level events, for example:

```text
message.sent
message.received
maintenance.created
maintenance.contractor_assigned
maintenance.completed
agent_task.created
agent_task.completed
```

Use `agentRuns` for runtime-level execution logs.

## Implementation Standards

Before editing Convex code, read:

```text
keyagent/convex/_generated/ai/guidelines.md
```

Use:

```text
query
mutation
v validators for every argument
indexes instead of filter
bounded list queries with take(limit)
```

Avoid:

```text
unbounded collect()
filter() on Convex queries
changing schema.ts without coordination
changing Tanvi-owned invoice/contract modules without coordination
```

## Validation Commands

Run from:

```text
keyagent/
```

Use:

```bash
npx tsc --noEmit
npm run lint
npx convex codegen
```

Known lint behavior: Convex generated files may show unused eslint-disable warnings. Those are not currently blocking.

## Branch Workflow

Before starting:

```bash
git pull --rebase
```

After a focused change:

```bash
git status
git add <files you changed>
git commit -m "Add comms Convex workflow functions"
git push
```

Keep commits scoped. Avoid combining comms, maintenance, schema, and UI changes in one commit.
