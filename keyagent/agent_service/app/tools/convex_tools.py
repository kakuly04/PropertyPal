from typing import Any

from agents import function_tool

from .convex_http import convex_tools


@function_tool
async def seed_demo_data() -> str:
    """Seed demo org, property, tenant, owner, and approved contractors in Convex."""
    data = await convex_tools.post("/agent-tools/seed-demo-data", {})
    return str(data["result"])


@function_tool
async def get_demo_context() -> str:
    """Load demo org, property, contacts, approved contractors, and recent tasks from Convex."""
    data = await convex_tools.post("/agent-tools/get-demo-context", {})
    return str(data["context"])


@function_tool
async def lookup_contractor(org_id: str, trade: str) -> str:
    """Look up active contractors by trade from Convex."""
    data = await convex_tools.post(
        "/agent-tools/lookup-contractors-by-trade",
        {
            "orgId": org_id,
            "trade": trade,
            "limit": 5,
        },
    )
    contractors = data["contractors"]

    if not contractors:
        return f"No active contractors found for trade: {trade}."

    return str(contractors)


@function_tool
async def create_maintenance_task(
    org_id: str,
    property_id: str,
    title: str,
    description: str,
    priority: str = "normal",
) -> str:
    """Create a maintenance task in Convex."""
    data = await convex_tools.post(
        "/agent-tools/create-maintenance-task",
        {
            "orgId": org_id,
            "propertyId": property_id,
            "title": title,
            "description": description,
            "priority": priority,
        },
    )
    return f"Maintenance task created in Convex: {data['taskId']}"


@function_tool
async def record_agent_result(org_id: str, agent_name: str, event_id: str, summary: str) -> str:
    """Record an agent result or audit summary in Convex."""
    data = await convex_tools.post(
        "/agent-tools/record-agent-result",
        {
            "orgId": org_id,
            "agentName": agent_name,
            "eventId": event_id,
            "source": "dashboard",
            "inputSummary": "Agent service result",
            "outputSummary": summary,
        },
    )
    return f"Agent result recorded in Convex: {data['agentRunId']}"


async def record_inbound_whatsapp(from_number: str, to_number: str, body: str, message_sid: str) -> str:
    settings = convex_tools.settings

    if not settings.keyagent_default_org_id:
        return "Inbound WhatsApp received but KEYAGENT_DEFAULT_ORG_ID is not configured."

    data = await convex_tools.post(
        "/agent-tools/record-inbound-whatsapp",
        {
            "orgId": settings.keyagent_default_org_id,
            "from": from_number,
            "to": to_number,
            "body": body,
            "messageSid": message_sid,
        },
    )
    return f"Inbound WhatsApp recorded in Convex: {data['messageId']}"


async def seed_demo_data_for_webhook() -> str:
    data = await convex_tools.post("/agent-tools/seed-demo-data", {})
    return f"Demo data ready: {data['result']}"


async def record_whatsapp_status(message_sid: str, status: str, error_code: str | None = None) -> str:
    settings = convex_tools.settings

    if not settings.keyagent_default_org_id:
        return "WhatsApp status received but KEYAGENT_DEFAULT_ORG_ID is not configured."

    data = await convex_tools.post(
        "/agent-tools/record-whatsapp-status",
        {
            "orgId": settings.keyagent_default_org_id,
            "messageSid": message_sid,
            "status": status,
            "errorCode": error_code,
        },
    )
    return f"WhatsApp status recorded in Convex: {data['messageId']}"


def compact_payload(payload: dict[str, Any]) -> str:
    return ", ".join(f"{key}={value}" for key, value in payload.items())
