from fastapi import FastAPI, Form, Request
from fastapi.responses import Response

from .agents.comms_agent import run_comms_agent
from .agents.maintenance_agent import run_maintenance_agent
from .agents.orchestrator_agent import run_orchestrator_agent
from .demo_outreach import looks_like_maintenance_request, send_demo_maintenance_outreach
from .schemas import AgentRunRequest, AgentRunResponse, AgentTaskProcessRequest, AgentTaskProcessResponse
from .settings import get_settings
from .task_processor import process_next_agent_task
from .tools.convex_tools import record_inbound_whatsapp, record_whatsapp_status, seed_demo_data_for_webhook
from propertypal_agents.common.demo import create_demo_external_file, ensure_demo_data
from propertypal_agents.common.types import (
    ContractUploadEvent,
    DemoExternalFileEvent,
    ExtractionPreviewEvent,
    InvoiceReimbursedEvent,
    InvoiceUploadEvent,
    LeaseExpiryCheckEvent,
    LocalFileExtractionPreviewEvent,
    RelistingDraftApprovalEvent,
    RelistingDraftEvent,
    RelistingDraftPreviewEvent,
    RelistingManuallyListedEvent,
    RenewalMeetingEvent,
)
from propertypal_agents.contract.drafts import build_relisting_draft_preview
from propertypal_agents.contract.extraction import extract_lease, extract_lease_from_local_path
from propertypal_agents.contract.service import run_contract_upload
from propertypal_agents.contract.workflows import (
    approve_relisting_draft,
    create_relisting_draft,
    mark_relisting_manually_listed,
    queue_renewal_meeting,
    run_lease_expiry_check,
)
from propertypal_agents.invoice.extraction import extract_invoice
from propertypal_agents.invoice.service import run_invoice_upload
from propertypal_agents.invoice.workflows import mark_reimbursed

app = FastAPI(title="KeyAgent Agent Service")


@app.get("/health")
async def health() -> dict[str, bool | str]:
    return {"ok": True, "service": "keyagent-agent-service"}


@app.post("/agents/comms/run", response_model=AgentRunResponse)
async def run_comms(request: AgentRunRequest) -> AgentRunResponse:
    output = await run_comms_agent(request)
    return AgentRunResponse(agent="CommsAgent", output=output)


@app.post("/agents/maintenance/run", response_model=AgentRunResponse)
async def run_maintenance(request: AgentRunRequest) -> AgentRunResponse:
    output = await run_maintenance_agent(request)
    return AgentRunResponse(agent="MaintenanceAgent", output=output)


@app.post("/agents/orchestrator/run", response_model=AgentRunResponse)
async def run_orchestrator(request: AgentRunRequest) -> AgentRunResponse:
    output = await run_orchestrator_agent(request)
    return AgentRunResponse(agent="OrchestratorAgent", output=output)


@app.post("/agents/tasks/process-next", response_model=AgentTaskProcessResponse)
async def process_next_task(request: AgentTaskProcessRequest) -> AgentTaskProcessResponse:
    return await process_next_agent_task(request)


@app.post("/demo/seed")
async def demo_seed():
    return await ensure_demo_data()


@app.post("/demo/external-file")
async def demo_external_file(event: DemoExternalFileEvent):
    return await create_demo_external_file(event)


@app.post("/agents/invoice/upload")
async def invoice_upload(event: InvoiceUploadEvent):
    return await run_invoice_upload(event)


@app.post("/agents/contract/upload")
async def contract_upload(event: ContractUploadEvent):
    return await run_contract_upload(event)


@app.post("/agents/invoice/extract-preview")
async def invoice_extract_preview(event: ExtractionPreviewEvent):
    return await extract_invoice(event.file_url)


@app.post("/agents/contract/extract-preview")
async def contract_extract_preview(event: ExtractionPreviewEvent):
    return await extract_lease(event.file_url)


@app.post("/agents/contract/extract-local-preview")
async def contract_extract_local_preview(event: LocalFileExtractionPreviewEvent):
    return await extract_lease_from_local_path(event.file_path)


@app.post("/agents/invoice/mark-reimbursed")
async def invoice_mark_reimbursed(event: InvoiceReimbursedEvent):
    return await mark_reimbursed(event)


@app.post("/agents/contract/check-expiring-leases")
async def contract_check_expiring_leases(event: LeaseExpiryCheckEvent):
    return await run_lease_expiry_check(event)


@app.post("/agents/contract/queue-renewal-meeting")
async def contract_queue_renewal_meeting(event: RenewalMeetingEvent):
    return await queue_renewal_meeting(event)


@app.post("/agents/contract/create-relisting-draft")
async def contract_create_relisting_draft(event: RelistingDraftEvent):
    return await create_relisting_draft(event)


@app.post("/agents/contract/relisting-draft-preview")
async def contract_relisting_draft_preview(event: RelistingDraftPreviewEvent):
    return build_relisting_draft_preview(event)


@app.post("/agents/contract/approve-relisting-draft")
async def contract_approve_relisting_draft(event: RelistingDraftApprovalEvent):
    return await approve_relisting_draft(event)


@app.post("/agents/contract/mark-relisting-manually-listed")
async def contract_mark_relisting_manually_listed(event: RelistingManuallyListedEvent):
    return await mark_relisting_manually_listed(event)


@app.post("/webhooks/twilio/whatsapp")
async def inbound_twilio_whatsapp(
    request: Request,
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(""),
    MessageSid: str = Form(""),
) -> Response:
    # Twilio sends application/x-www-form-urlencoded webhook payloads.
    settings = get_settings()
    seed_result = await seed_demo_data_for_webhook()
    convex_result = await record_inbound_whatsapp(From, To, Body, MessageSid)
    orchestrator_request = AgentRunRequest(
        org_id=settings.keyagent_default_org_id or "demo",
        input=(
            "Route this inbound WhatsApp message through the normal KeyAgent orchestration flow.\n"
            f"From: {From}\n"
            f"To: {To}\n"
            f"MessageSid: {MessageSid}\n"
            f"Body: {Body}"
        ),
        event_id=MessageSid,
        payload={
            "from": From,
            "to": To,
            "body": Body,
            "messageSid": MessageSid,
        },
    )
    orchestrator_result = await run_orchestrator_agent(orchestrator_request)
    outreach_result = None

    if looks_like_maintenance_request(Body):
        outreach_result = await send_demo_maintenance_outreach(Body, From)

    print(
        {
            "event": "twilio.whatsapp.inbound",
            "from": From,
            "to": To,
            "body": Body,
            "message_sid": MessageSid,
            "seed_result": seed_result,
            "convex_result": convex_result,
            "orchestrator_result": orchestrator_result,
            "outreach_result": outreach_result,
            "url": str(request.url),
        }
    )
    return Response(content="<Response></Response>", media_type="application/xml")


@app.post("/webhooks/twilio/whatsapp/status")
async def twilio_whatsapp_status(
    request: Request,
    MessageSid: str = Form(""),
    MessageStatus: str = Form(""),
    SmsStatus: str = Form(""),
    ErrorCode: str | None = Form(None),
) -> Response:
    status = MessageStatus or SmsStatus or "unknown"
    convex_result = await record_whatsapp_status(MessageSid, status, ErrorCode)
    print(
        {
            "event": "twilio.whatsapp.status",
            "message_sid": MessageSid,
            "status": status,
            "error_code": ErrorCode,
            "convex_result": convex_result,
            "url": str(request.url),
        }
    )
    return Response(content="<Response></Response>", media_type="application/xml")
