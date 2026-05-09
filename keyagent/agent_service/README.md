# KeyAgent Agent Service

<<<<<<< Updated upstream
Python FastAPI service for specialist agents.

Run from the repo root:

```bash
cd keyagent
PYTHONPATH=agent_service uvicorn agent_service.server:app --reload --port 8000
```

Required environment variables:

```text
OPENAI_API_KEY
CONVEX_URL or NEXT_PUBLIC_CONVEX_URL
```

Optional:

```text
OPENAI_AGENT_MODEL
OPENAI_EXTRACTION_MODEL
CONVEX_AUTH_TOKEN
```

Current endpoints:

```text
GET  /health
POST /agents/invoice/upload
POST /agents/contract/upload
POST /agents/invoice/extract-preview
POST /agents/contract/extract-preview
POST /agents/contract/extract-local-preview
POST /agents/invoice/mark-reimbursed
POST /agents/contract/check-expiring-leases
POST /agents/contract/queue-renewal-meeting
POST /agents/contract/relisting-draft-preview
POST /agents/contract/create-relisting-draft
POST /agents/contract/approve-relisting-draft
POST /agents/contract/mark-relisting-manually-listed
```

The `extract-preview` endpoints only call OpenAI and return structured extraction output.
They do not create Convex records, so they are the fastest way to test extraction quality.
The `extract-local-preview` endpoint is for local development only and uploads a local PDF
to OpenAI before extraction.

Relisting is handled as a copyable listing draft card. The system does not log in to
PropertyGuru, autofill AgentNet, or publish listings.

Example invoice payload:

```json
{
  "eventId": "evt_invoice_001",
  "orgId": "convex_org_id",
  "propertyId": "convex_property_id",
  "source": "upload",
  "receiptFileId": "convex_file_id",
  "submittedByContactId": "convex_contact_id",
  "paidBy": "Tenant Name"
}
```

Example contract payload:

```json
{
  "eventId": "evt_lease_001",
  "orgId": "convex_org_id",
  "propertyId": "convex_property_id",
  "source": "upload",
  "leaseFileId": "convex_file_id",
  "tenantId": "convex_contact_id"
}
=======
FastAPI service for the Python OpenAI Agents SDK layer.

This first slice includes:

- `CommunicationsAgent`
- `MaintenanceAgent`
- Placeholder tools for Convex, Resend, Twilio WhatsApp, ElevenLabs voice, and calendar scheduling

## Run locally

```bash
cd agent_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment

```bash
OPENAI_API_KEY=
KEYAGENT_AGENT_MODEL=gpt-4.1
CONVEX_URL=
CONVEX_SITE_URL=
KEYAGENT_WEBHOOK_SECRET=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
ELEVENLABS_API_KEY=
>>>>>>> Stashed changes
```
