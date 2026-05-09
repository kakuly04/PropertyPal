from agents import Agent, Runner

from ..schemas import AgentRunRequest
from ..settings import get_settings
from ..tools.comms_tools import call_with_voice, create_calendar_event, poll_availability, send_email, send_whatsapp
from ..tools.convex_tools import record_agent_result


def build_comms_agent() -> Agent:
    settings = get_settings()

    return Agent(
        name="CommsAgent",
        model=settings.keyagent_agent_model,
        instructions=(
            "You coordinate communication for KeyAgent. Use the smallest appropriate channel: "
            "email for formal updates, WhatsApp for fast coordination, and voice for urgent contractor calls. "
            "When another agent asks for scheduling, poll all parties for availability and return a concise summary. "
            "For maintenance scheduling, email and WhatsApp the contractor, then WhatsApp the tenant. "
            "For the hackathon demo, report that the Google Calendar event is ready to create once both parties confirm. "
            "Do not make property-management decisions; report human responses and delivery state."
        ),
        tools=[send_email, send_whatsapp, call_with_voice, poll_availability, create_calendar_event, record_agent_result],
    )


async def run_comms_agent(request: AgentRunRequest) -> str:
    result = await Runner.run(build_comms_agent(), request.input)
    return str(result.final_output)
