from typing import Any, Literal

from pydantic import BaseModel, Field


AgentName = Literal["CommsAgent", "MaintenanceAgent", "OrchestratorAgent", "InvoiceAgent", "ContractAgent"]


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


class AgentTaskProcessRequest(BaseModel):
    org_id: str = "demo"
    assigned_agent: AgentName | None = None


class AgentTaskProcessResponse(BaseModel):
    processed: bool
    agent_task_id: str | None = None
    assigned_agent: AgentName | None = None
    output: str | None = None
    error: str | None = None
