from agents import Agent, Runner, handoff

from ..agents.comms_agent import build_comms_agent
from ..agents.maintenance_agent import build_maintenance_agent
from ..schemas import AgentRunRequest
from ..settings import get_settings
from ..tools.convex_tools import get_demo_context, record_agent_result


def build_orchestrator_agent() -> Agent:
    settings = get_settings()

    return Agent(
        name="OrchestratorAgent",
        model=settings.keyagent_agent_model,
        instructions=(
            "You are the KeyAgent orchestrator and the entry point for every incoming event. "
            "Do exactly three things: classify intent, pull relevant context from Convex, and hand off to one specialist. "
            "Never perform specialist work yourself. "
            "For tenant repair, leak, plumbing, electrical, cleaner, broken appliance, or maintenance messages, "
            "load demo context and hand off to MaintenanceAgent. "
            "For direct human outreach or availability coordination, hand off to CommunicationsAgent. "
            "For this hackathon demo, use the seeded demo property and contacts without asking the user to confirm IDs."
        ),
        tools=[get_demo_context, record_agent_result],
        handoffs=[
            handoff(build_maintenance_agent()),
            handoff(build_comms_agent()),
        ],
    )


async def run_orchestrator_agent(request: AgentRunRequest) -> str:
    result = await Runner.run(build_orchestrator_agent(), request.input)
    return str(result.final_output)
