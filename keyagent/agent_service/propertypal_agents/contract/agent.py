from agents import Agent

from propertypal_agents.common.config import get_settings
from .prompts import CONTRACT_AGENT_INSTRUCTIONS


def build_contract_agent() -> Agent:
    settings = get_settings()
    return Agent(
        name="ContractAgent",
        instructions=CONTRACT_AGENT_INSTRUCTIONS,
        model=settings.openai_agent_model,
    )
