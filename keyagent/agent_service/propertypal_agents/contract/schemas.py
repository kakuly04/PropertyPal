from pydantic import BaseModel, Field


class LeaseExtraction(BaseModel):
    tenant_name: str | None = Field(default=None, description="Tenant name from the lease.")
    property_address: str | None = Field(default=None, description="Property address from the lease.")
    start_date: str | None = Field(default=None, description="Lease start date as YYYY-MM-DD.")
    end_date: str | None = Field(default=None, description="Lease end date as YYYY-MM-DD.")
    rent_amount: float | None = Field(default=None, description="Rent amount.")
    currency: str | None = Field(default=None, description="Currency code, e.g. SGD.")
    payment_frequency: str = Field(description="monthly, quarterly, yearly, or unknown.")
    deposit_amount: float | None = Field(default=None, description="Deposit amount if present.")
    confidence: float = Field(description="Extraction confidence from 0 to 1.")
    needs_review: bool = Field(description="Whether a human should review the extraction.")
    summary: str = Field(description="Short human-readable lease summary.")
