from fastapi import FastAPI, Form, Request
from fastapi.responses import Response

from .agents.comms_agent import run_comms_agent
from .agents.maintenance_agent import run_maintenance_agent
from .agents.orchestrator_agent import run_orchestrator_agent
from .demo_outreach import looks_like_maintenance_request, send_demo_maintenance_outreach
from .schemas import AgentRunRequest, AgentRunResponse
from .settings import get_settings
from .tools.convex_tools import record_inbound_whatsapp, record_whatsapp_status, seed_demo_data_for_webhook

app = FastAPI(title="KeyAgent Agent Service")


@app.get("/health")
async def health() -> dict[str, bool | str]:
    return {"ok": True, "service": "keyagent-agent-service"}


@app.post("/agents/comms/run", response_model=AgentRunResponse)
async def run_comms(request: AgentRunRequest) -> AgentRunResponse:
    output = await run_comms_agent(request)
    return AgentRunResponse(agent="CommunicationsAgent", output=output)


@app.post("/agents/maintenance/run", response_model=AgentRunResponse)
async def run_maintenance(request: AgentRunRequest) -> AgentRunResponse:
    output = await run_maintenance_agent(request)
    return AgentRunResponse(agent="MaintenanceAgent", output=output)


@app.post("/agents/orchestrator/run", response_model=AgentRunResponse)
async def run_orchestrator(request: AgentRunRequest) -> AgentRunResponse:
    output = await run_orchestrator_agent(request)
    return AgentRunResponse(agent="OrchestratorAgent", output=output)


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
