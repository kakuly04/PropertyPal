from agents import Agent, Runner, handoff

from ..agents.comms_agent import build_comms_agent
from ..schemas import AgentRunRequest
from ..settings import get_settings
from ..tools.convex_tools import create_maintenance_task, get_demo_context, lookup_contractor, record_agent_result


def build_maintenance_agent() -> Agent:
    settings = get_settings()

    return Agent(
        name="MaintenanceAgent",
        model=settings.keyagent_agent_model,
        instructions=(
            "You handle tenant maintenance requests. Follow this sequence exactly: "
            "1. Load demo context from Convex if org/property/contact IDs are not already explicit. "
            "2. Classify the repair type as plumber, electrician, cleaner, or general. "
            "3. Create a maintenance task in Convex for the matching property. "
            "4. Look up an approved contractor by trade from Convex. "
            "5. Hand off to CommunicationsAgent to email and WhatsApp the contractor for availability, "
            "then contact the tenant to agree on a slot. "
            "6. Summarize the planned Google Calendar event for all parties. "
            "7. After the job, ask CommunicationsAgent to send a tenant verification prompt. "
            "For this hackathon demo, use the seeded demo property and contacts without asking the user for confirmation."
        ),
        tools=[get_demo_context, create_maintenance_task, lookup_contractor, record_agent_result],
        handoffs=[handoff(build_comms_agent())],
    )


async def run_maintenance_agent(request: AgentRunRequest) -> str:
    result = await Runner.run(build_maintenance_agent(), request.input)
    return str(result.final_output)
