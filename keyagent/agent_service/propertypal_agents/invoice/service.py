from propertypal_agents.common.convex_client import convex
from propertypal_agents.common.demo import resolve_demo_ids
from propertypal_agents.common.file_refs import get_file_url
from propertypal_agents.common.types import AgentResult, InvoiceUploadEvent
from .extraction import extract_invoice


async def run_invoice_upload(event: InvoiceUploadEvent) -> AgentResult:
    client = convex()
    org_id, property_id, demo = await resolve_demo_ids(event.org_id, event.property_id)
    if property_id is None:
        raise RuntimeError("propertyId is required unless orgId is demo and demo data can be seeded.")
    submitted_by_contact_id = event.submitted_by_contact_id or (demo.get("tenantId") if demo else None)

    agent_run_id = await client.mutation(
        "agentRuns:startAgentRun",
        {
            "orgId": org_id,
            "agentName": "InvoiceAgent",
            "eventId": event.event_id,
            "source": event.source,
            "inputSummary": f"Extract invoice data from receipt file {event.receipt_file_id}.",
        },
    )

    try:
        invoice_id = await client.mutation(
            "invoices:createInvoiceFromReceipt",
            {
                "orgId": org_id,
                "propertyId": property_id,
                "submittedByContactId": submitted_by_contact_id,
                "receiptFileId": event.receipt_file_id,
                "paidBy": event.paid_by,
            },
        )

        await client.mutation("files:markFileProcessing", {"fileId": event.receipt_file_id})
        file_url = await get_file_url(client, event.receipt_file_id)
        extraction = await extract_invoice(file_url)

        await client.mutation(
            "invoices:updateInvoiceExtraction",
            {
                "invoiceId": invoice_id,
                "vendorName": extraction.vendor_name,
                "amount": extraction.amount,
                "currency": extraction.currency,
                "invoiceDate": extraction.invoice_date,
                "category": extraction.category,
                "paidBy": extraction.paid_by or event.paid_by,
                "extractionConfidence": extraction.confidence,
                "extractionStatus": "needs_review" if extraction.needs_review else "completed",
            },
        )
        await client.mutation("files:markFileReady", {"fileId": event.receipt_file_id})

        approval = await client.mutation(
            "invoices:submitInvoiceForApproval",
            {
                "invoiceId": invoice_id,
                "requestedByRunId": agent_run_id,
                "summary": extraction.summary,
                "details": "Review and approve reimbursement before marking it reimbursed.",
            },
        )

        await client.mutation(
            "agentRuns:completeAgentRun",
            {
                "agentRunId": agent_run_id,
                "outputSummary": f"Created invoice {invoice_id} and approval {approval['approvalId']}.",
            },
        )

        return AgentResult(
            agent="InvoiceAgent",
            event_id=event.event_id,
            status="waiting_for_approval",
            target_id=invoice_id,
            approval_id=approval["approvalId"],
            summary=extraction.summary,
            details=extraction.model_dump(),
        )
    except Exception as exc:
        await client.mutation("files:markFileFailed", {"fileId": event.receipt_file_id})
        await client.mutation(
            "agentRuns:failAgentRun",
            {"agentRunId": agent_run_id, "error": str(exc), "outputSummary": "Invoice upload failed."},
        )
        raise
