from typing import Any, Literal

from pydantic import BaseModel, Field


EventSource = Literal["dashboard", "whatsapp", "email", "cron", "upload"]


class BaseAgentEvent(BaseModel):
    event_id: str = Field(alias="eventId")
    org_id: str = Field(alias="orgId")
    property_id: str | None = Field(default=None, alias="propertyId")
    source: EventSource = "upload"
    requested_by_run_id: str | None = Field(default=None, alias="requestedByRunId")


class InvoiceUploadEvent(BaseAgentEvent):
    receipt_file_id: str = Field(alias="receiptFileId")
    submitted_by_contact_id: str | None = Field(default=None, alias="submittedByContactId")
    paid_by: str | None = Field(default=None, alias="paidBy")


class ContractUploadEvent(BaseAgentEvent):
    lease_file_id: str = Field(alias="leaseFileId")
    tenant_id: str | None = Field(default=None, alias="tenantId")


class ExtractionPreviewEvent(BaseModel):
    file_url: str = Field(alias="fileUrl")


class LocalFileExtractionPreviewEvent(BaseModel):
    file_path: str = Field(alias="filePath")


class AgentResult(BaseModel):
    agent: str
    event_id: str
    status: Literal["completed", "failed", "waiting_for_approval"]
    target_id: str | None = None
    approval_id: str | None = None
    summary: str
    details: dict[str, Any] = Field(default_factory=dict)


class InvoiceReimbursedEvent(BaseModel):
    invoice_id: str = Field(alias="invoiceId")
    reimbursed_at: str | None = Field(default=None, alias="reimbursedAt")
    queue_tenant_confirmation: bool = Field(default=True, alias="queueTenantConfirmation")


class LeaseExpiryCheckEvent(BaseModel):
    org_id: str = Field(alias="orgId")
    days_ahead: int = Field(default=60, alias="daysAhead")
    limit: int = 100


class RenewalMeetingEvent(BaseModel):
    lease_id: str = Field(alias="leaseId")
    task_id: str | None = Field(default=None, alias="taskId")
    requested_by_run_id: str | None = Field(default=None, alias="requestedByRunId")
    meeting_summary: str | None = Field(default=None, alias="meetingSummary")


class RelistingDraftEvent(BaseModel):
    lease_id: str = Field(alias="leaseId")
    task_id: str | None = Field(default=None, alias="taskId")
    requested_by_run_id: str | None = Field(default=None, alias="requestedByRunId")
    new_rent_amount: float = Field(alias="newRentAmount")
    currency: str | None = None
    available_from: str | None = Field(default=None, alias="availableFrom")
    photo_file_ids: list[str] = Field(default_factory=list, alias="photoFileIds")
    headline: str | None = None
    bedrooms: float | None = None
    bathrooms: float | None = None
    floor_area: float | None = Field(default=None, alias="floorArea")
    furnishing: str | None = None
    listing_description: str | None = Field(default=None, alias="listingDescription")
    additional_notes: str | None = Field(default=None, alias="additionalNotes")


class RelistingDraftPreviewEvent(BaseModel):
    address: str
    new_rent_amount: float = Field(alias="newRentAmount")
    currency: str = "SGD"
    available_from: str | None = Field(default=None, alias="availableFrom")
    headline: str | None = None
    bedrooms: float | None = None
    bathrooms: float | None = None
    floor_area: float | None = Field(default=None, alias="floorArea")
    furnishing: str | None = None
    listing_description: str | None = Field(default=None, alias="listingDescription")
    additional_notes: str | None = Field(default=None, alias="additionalNotes")


class RelistingDraftApprovalEvent(BaseModel):
    relisting_draft_id: str = Field(alias="relistingDraftId")
    approval_id: str | None = Field(default=None, alias="approvalId")
    decided_by_membership_id: str | None = Field(default=None, alias="decidedByMembershipId")


class RelistingManuallyListedEvent(BaseModel):
    relisting_draft_id: str = Field(alias="relistingDraftId")
    manually_listed_by_membership_id: str | None = Field(default=None, alias="manuallyListedByMembershipId")


class DemoExternalFileEvent(BaseModel):
    org_id: str = Field(alias="orgId")
    property_id: str | None = Field(default=None, alias="propertyId")
    external_url: str = Field(alias="externalUrl")
    original_name: str = Field(alias="originalName")
    content_type: str = Field(alias="contentType")
    purpose: Literal["lease_pdf", "invoice_receipt"]
