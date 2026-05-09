from agents import Agent

from propertypal_agents.common.config import get_settings
from .prompts import INVOICE_AGENT_INSTRUCTIONS


def build_invoice_agent() -> Agent:
    settings = get_settings()
    return Agent(
        name="InvoiceAgent",
        instructions=INVOICE_AGENT_INSTRUCTIONS,
        model=settings.openai_agent_model,
    )
