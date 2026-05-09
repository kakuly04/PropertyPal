from typing import Any, Literal

from pydantic import BaseModel, Field


AgentName = Literal["CommunicationsAgent", "MaintenanceAgent", "OrchestratorAgent"]


class AgentRunRequest(BaseModel):
    org_id: str
    input: str
    event_id: str | None = None
    property_id: str | None = None
    task_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class AgentRunResponse(BaseModel):
    agent: AgentName
    output: str
