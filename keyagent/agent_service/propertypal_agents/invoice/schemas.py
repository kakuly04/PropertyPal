from pydantic import BaseModel, Field


class InvoiceExtraction(BaseModel):
    vendor_name: str | None = Field(default=None, description="Vendor or merchant name.")
    amount: float | None = Field(default=None, description="Total amount paid.")
    currency: str | None = Field(default=None, description="Currency code, e.g. SGD.")
    invoice_date: str | None = Field(default=None, description="Invoice or receipt date as YYYY-MM-DD.")
    category: str | None = Field(default=None, description="Expense category.")
    paid_by: str | None = Field(default=None, description="Person who paid, if visible.")
    confidence: float = Field(description="Extraction confidence from 0 to 1.")
    needs_review: bool = Field(description="Whether a human should review the extraction.")
    summary: str = Field(description="Short human-readable summary of the receipt.")
