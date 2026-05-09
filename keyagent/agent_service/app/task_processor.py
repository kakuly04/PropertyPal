from typing import Any

from propertypal_agents.common.convex_client import convex
from propertypal_agents.common.demo import resolve_demo_ids
from propertypal_agents.common.types import RenewalMeetingEvent
from propertypal_agents.contract.workflows import queue_renewal_meeting

from .agents.comms_agent import run_comms_agent
from .agents.maintenance_agent import run_maintenance_agent
from .agents.orchestrator_agent import run_orchestrator_agent
from .schemas import AgentRunRequest, AgentTaskProcessRequest, AgentTaskProcessResponse


async def process_next_agent_task(request: AgentTaskProcessRequest) -> AgentTaskProcessResponse:
    client = convex()
    org_id, _property_id, _demo = await resolve_demo_ids(request.org_id)
    queued = await client.query(
        "agentTasks:listQueuedAgentTasks",
        {
            "orgId": org_id,
            "assignedAgent": request.assigned_agent,
            "limit": 1,
        },
    )
    if not queued:
        return AgentTaskProcessResponse(processed=False)

    task = queued[0]
    task_id = task["_id"]
    assigned_agent = task["assignedAgent"]

    try:
        await client.mutation("agentTasks:claimAgentTask", {"agentTaskId": task_id})
        output = await _dispatch_task(task)
        await client.mutation("agentTasks:completeAgentTask", {"agentTaskId": task_id})
        return AgentTaskProcessResponse(
            processed=True,
            agent_task_id=task_id,
            assigned_agent=assigned_agent,
            output=output,
        )
    except Exception as exc:
        await client.mutation(
            "agentTasks:failAgentTask",
            {"agentTaskId": task_id, "lastError": str(exc)},
        )
        return AgentTaskProcessResponse(
            processed=True,
            agent_task_id=task_id,
            assigned_agent=assigned_agent,
            error=str(exc),
        )


async def _dispatch_task(task: dict[str, Any]) -> str:
    assigned_agent = task["assignedAgent"]
    payload = task.get("payload") or {}
    task_type = task.get("type", "agent_task")
    request = AgentRunRequest(
        org_id=task["orgId"],
        event_id=task.get("eventId"),
        property_id=task.get("propertyId"),
        task_id=task.get("taskId"),
        payload=payload,
        input=(
            f"Process queued agent task '{task_type}'.\n"
            f"Convex agentTaskId: {task['_id']}\n"
            f"Payload: {payload}"
        ),
    )

    if assigned_agent == "ContractAgent" and task_type == "lease_expiry_workflow":
        lease_id = payload.get("leaseId")
        if not lease_id:
            raise RuntimeError("lease_expiry_workflow task missing payload.leaseId")
        result = await queue_renewal_meeting(
            RenewalMeetingEvent(
                leaseId=lease_id,
                taskId=task.get("taskId"),
                meetingSummary="Schedule lease renewal discussion between owner and property manager.",
            )
        )
        return f"ContractAgent queued CommsAgent renewal meeting task: {result}"

    if assigned_agent == "CommsAgent":
        return await run_comms_agent(request)

    if assigned_agent == "MaintenanceAgent":
        return await run_maintenance_agent(request)

    if assigned_agent == "OrchestratorAgent":
        return await run_orchestrator_agent(request)

    if assigned_agent in {"InvoiceAgent", "ContractAgent"}:
        return (
            f"{assigned_agent} task type '{task_type}' is recorded and ready for the "
            "specific upload/workflow endpoint."
        )

    raise RuntimeError(f"Unsupported assignedAgent: {assigned_agent}")
