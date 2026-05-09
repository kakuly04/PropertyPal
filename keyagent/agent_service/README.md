# KeyAgent Agent Service

FastAPI service for the Python OpenAI Agents SDK layer and the invoice/contract workflow endpoints.

Run locally:

```bash
cd keyagent/agent_service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Required environment:

```text
OPENAI_API_KEY
CONVEX_URL or NEXT_PUBLIC_CONVEX_URL
CONVEX_SITE_URL or NEXT_PUBLIC_CONVEX_SITE_URL
```

Optional environment:

```text
OPENAI_AGENT_MODEL
OPENAI_EXTRACTION_MODEL
KEYAGENT_AGENT_MODEL
CONVEX_AUTH_TOKEN
KEYAGENT_WEBHOOK_SECRET
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
ELEVENLABS_API_KEY
```

Main endpoints:

```text
GET  /health
POST /demo/seed
POST /demo/external-file
POST /agents/orchestrator/run
POST /agents/comms/run
POST /agents/maintenance/run
POST /agents/tasks/process-next
POST /agents/invoice/upload
POST /agents/invoice/extract-preview
POST /agents/invoice/mark-reimbursed
POST /agents/contract/upload
POST /agents/contract/extract-preview
POST /agents/contract/extract-local-preview
POST /agents/contract/check-expiring-leases
POST /agents/contract/queue-renewal-meeting
POST /agents/contract/relisting-draft-preview
POST /agents/contract/create-relisting-draft
POST /agents/contract/approve-relisting-draft
POST /agents/contract/mark-relisting-manually-listed
POST /webhooks/twilio/whatsapp
POST /webhooks/twilio/whatsapp/status
```

The system uses `CommsAgent` as the canonical communications agent name across Python, Convex, and the frontend.
