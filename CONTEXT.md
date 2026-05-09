# KeyAgent Context

## Project
- Name: `KeyAgent`
- Goal: production-grade multi-agent property management platform.
- Starting point: greenfield build in this repository.

## Confirmed Stack
- Frontend: Next.js 14 (App Router), TypeScript strict mode, Tailwind CSS.
- Backend/data: Convex (database, file storage, scheduled functions, real-time updates).
- Agent layer: OpenAI Agents SDK in Python (`openai-agents`).
- Integrations: Resend (email), Twilio (WhatsApp), ElevenLabs (voice), Playwright (browser automation).
- Deployment: Vercel (frontend) + external service host for Python agents/Playwright.

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
- PropertyGuru automation credential and flow specifics.
- ElevenLabs v1 enablement preference.
- OpenAI project/org details.
- Preferred host/region for Python agent + Playwright services.
- Default timezone and SLA reminder window.

## Delivery Objective (v1)
- End-to-end operation where inbound WhatsApp/email events are triaged by orchestrator, delegated to specialist agents, actioned with approval gates, and reflected in real time in the dashboard.
