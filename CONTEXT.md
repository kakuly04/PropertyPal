# KeyAgent Context

## Project
- Name: `KeyAgent`
- Goal: production-grade multi-agent property management platform.
- Starting point: greenfield build in this repository.

## Confirmed Stack
- Frontend: Next.js 14 (App Router), TypeScript strict mode, Tailwind CSS.
- Backend/data: Convex (database, file storage, scheduled functions, real-time updates).
- Agent layer: OpenAI Agents SDK in Python (`openai-agents`).
- Integrations: Resend (email), Twilio (WhatsApp), ElevenLabs (voice).
- Deployment: Vercel (frontend) + external service host for Python agents.

## Confirmed Product Decisions
- Auth: Convex Auth.
- Tenancy model: org-per-property-manager (each org can manage multiple properties).
- Agent safety: human-in-the-loop for sensitive actions.
- Environment strategy: dev + prod.
- v1 channels: WhatsApp + email (outbound and inbound).

## Multi-Agent Architecture
- `OrchestratorAgent`: entry point for all events; classifies intent, loads context from Convex, hands off to specialist.
- `MaintenanceAgent`: vendor lookup, scheduling workflow, post-job verification.
- `ContractAgent`: lease extraction from PDF, lease-expiry workflow, relisting trigger.
- `CommsAgent`: all external communications (WhatsApp/email/voice), availability polling, reminders.
- `InvoiceAgent`: receipt OCR/extraction, claim creation, approval + reimbursement flow.

## Core Workflow Principles
- Orchestrator never executes business side effects directly.
- Specialists have tight prompts and minimal tool scopes.
- Use `handoff()` between agents for context-preserving transfer.
- Sensitive actions require approval and must be auditable.

## Planned Data Domains (Convex)
- Identity/tenancy: orgs, users, memberships, roles.
- Properties: properties, units, tenants, owners, contractors.
- Ops: maintenance requests/jobs, leases, invoices/claims, approvals.
- Messaging: conversations, messages, channel identities, delivery states.
- Agent runtime: tasks, runs, handoffs, tool calls, audit logs.
- Files: lease PDFs, invoice images/PDFs, listing photos.

## Pending Inputs Needed From User
- Resend sending/inbound domain details.
- Twilio WhatsApp sender + webhook configuration details.
- Google Calendar auth mode (service account vs OAuth).
- ElevenLabs v1 enablement preference.
- OpenAI project/org details.
- Preferred host/region for Python agent service.
- Default timezone and SLA reminder window.

## Delivery Objective (v1)
- End-to-end operation where inbound WhatsApp/email events are triaged by orchestrator, delegated to specialist agents, actioned with approval gates, and reflected in real time in the dashboard.

## Team Handoff
- Teammate/Codex coordination notes live in `TEAMMATE_CODEX_HANDOFF.md`.

## Implementation Log

### 2026-05-09
- Created the `keyagent/` Next.js app scaffold with Convex initialized.
- Expanded `keyagent/convex/schema.ts` from the starter tables into the shared v1 multi-agent schema.
- Added shared data domains for org tenancy, memberships, files, approvals, agent runs, audit logs, agent tasks, conversations, and messages.
- Expanded operational tables for contacts, properties, leases, tasks, and invoices with org scoping, statuses, timestamps, extraction fields, and query indexes.
- Added Convex modules for invoice/contract-agent foundation work:
  - `keyagent/convex/files.ts`
  - `keyagent/convex/invoices.ts`
  - `keyagent/convex/leases.ts`
  - `keyagent/convex/approvals.ts`
  - `keyagent/convex/agentRuns.ts`
  - `keyagent/convex/auditLogs.ts`
- Invoice flow now has database functions for receipt file metadata, invoice creation, extraction updates, approval submission, approval/rejection, reimbursement, and invoice listing.
- Contract flow now has database functions for lease PDF records, lease extraction updates, review submission, extraction confirmation, lease listing, and expiring lease lookup.
- Shared audit and agent run helpers are in place so Python agents can log execution and business actions consistently.
- Added the Python specialist-agent service scaffold under `keyagent/agent_service/`.
- Added FastAPI endpoints for `POST /agents/invoice/upload` and `POST /agents/contract/upload`.
- Added `InvoiceAgent` and `ContractAgent` package structure with prompts, Pydantic extraction schemas, OpenAI structured extraction calls, Convex client utilities, and service-layer upload workflows.
- Invoice upload workflow now starts an agent run, creates an invoice claim, marks the receipt file processing/ready, extracts receipt fields with OpenAI, submits an approval, logs completion, and returns the invoice/approval IDs.
- Contract upload workflow now starts an agent run, creates a lease record, marks the lease file processing/ready, extracts lease fields with OpenAI, submits review when needed, confirms extraction when safe, logs completion, and returns the lease/approval IDs.
- Tested agent-service preview endpoints with OpenAI:
  - Receipt image `https://worktrek.com/wp-content/uploads/2026/01/image1-1.png` extracted vendor `Premier Maintenance`, amount `1105.3`, currency `USD`, date `2025-02-21`, category `Maintenance & Repairs`, confidence `0.98`.
  - Local lease PDF `/Users/tanvi/Downloads/sample_fake_lease_agreement_ocr_test.pdf` extracted tenant `Priya Menon`, address `71 Cantonment Close #12-184 Singapore 080071`, start `2026-04-01`, end `2027-03-31`, rent `2450.0`, currency `SGD`, frequency `monthly`, deposit `2450.0`, confidence `1.0`.
- Extended InvoiceAgent workflow support beyond extraction:
  - `markInvoiceReimbursed` can now queue a `CommsAgent` task to confirm reimbursement with the tenant.
  - Agent service exposes `POST /agents/invoice/mark-reimbursed`.
- Extended ContractAgent workflow support beyond extraction:
  - Added Convex daily cron `create lease expiry tasks` that creates `lease_renewal` tasks and queued `ContractAgent` tasks for leases expiring within 60 days.
  - Added renewal-meeting queueing that creates a `CommsAgent` task instead of sending messages/calendar invites directly.
  - Replaced PropertyGuru posting/autofill with a safe copyable relisting draft flow because demoing AgentNet listing creation requires a valid CEA/AgentNet setup.
  - Added `relistingDrafts` storage with copy fields for headline, address, listing type, rent, availability, details, description, and full listing text.
  - Agent service exposes endpoints for expiry checks, renewal meeting queueing, relisting draft preview, draft creation, draft approval, and marking a draft manually listed.
- Added demo seed support:
  - Agent service accepts `orgId: "demo"` for demo workflows and resolves it to the seeded Convex org/property/tenant records internally.
  - Added `/demo/seed` and `/demo/external-file` endpoints for local testing without auth/UI upload.
  - `files.externalUrl` supports URL-backed demo file records so OpenAI extraction can run against public URLs or local PDF paths during development.
- Verified full demo workflows with `orgId: "demo"`:
  - Full InvoiceAgent upload wrote invoice `j97bygywfw4njdepcartgmrpdn86dwdw`, approval `k175j7ag3jvp6vbpgnp3t5je2x86c955`, and reimbursement queued CommsAgent task `jx70g746y7ktxcj304961dsx2186cdx1`.
  - Full ContractAgent upload wrote lease `jd7cch2yfm3av456ahkxh0dcsn86dwnd`.
  - Lease expiry check created renewal task `jn77xzngdk7j0pzx3y0t4hbzpd86ccec` and ContractAgent task `jx70mz4wksdnsypc0x6r940sxh86chef`.
  - Renewal meeting queue created CommsAgent task `jx76k81y819n9m4bpvs2ykc76586c041`.
  - Relisting draft flow created draft `kx77md829qr68sddwk4k26qwy586dv5z`, approval `k172y70byptwv0f7qyp6hs8pn586cj6z`, approved it, and marked it manually listed.
