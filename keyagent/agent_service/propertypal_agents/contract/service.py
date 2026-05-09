from propertypal_agents.common.convex_client import convex
from propertypal_agents.common.demo import resolve_demo_ids
from propertypal_agents.common.file_refs import get_file_url
from propertypal_agents.common.types import AgentResult, ContractUploadEvent
from .extraction import extract_lease, extract_lease_from_local_path


def _payment_frequency(value: str) -> str:
    normalized = value.lower().strip()
    if normalized in {"monthly", "quarterly", "yearly"}:
        return normalized
    return "unknown"


async def run_contract_upload(event: ContractUploadEvent) -> AgentResult:
    client = convex()
    org_id, property_id, demo = await resolve_demo_ids(event.org_id, event.property_id)
    if property_id is None:
        raise RuntimeError("propertyId is required unless orgId is demo and demo data can be seeded.")
    tenant_id = event.tenant_id or (demo.get("tenantId") if demo else None)

    agent_run_id = await client.mutation(
        "agentRuns:startAgentRun",
        {
            "orgId": org_id,
            "agentName": "ContractAgent",
            "eventId": event.event_id,
            "source": event.source,
            "inputSummary": f"Extract lease data from PDF file {event.lease_file_id}.",
        },
    )

    try:
        lease_id = await client.mutation(
            "leases:createLeaseFromPdf",
            {
                "orgId": org_id,
                "propertyId": property_id,
                "tenantId": tenant_id,
                "leaseFileId": event.lease_file_id,
            },
        )

        await client.mutation("files:markFileProcessing", {"fileId": event.lease_file_id})
        file_url = await get_file_url(client, event.lease_file_id)
        if file_url.startswith("/"):
            extraction = await extract_lease_from_local_path(file_url)
        else:
            extraction = await extract_lease(file_url)

        await client.mutation(
            "leases:updateLeaseExtraction",
            {
                "leaseId": lease_id,
                "tenantId": tenant_id,
                "startDate": extraction.start_date,
                "endDate": extraction.end_date,
                "rentAmount": extraction.rent_amount,
                "currency": extraction.currency,
                "paymentFrequency": _payment_frequency(extraction.payment_frequency),
                "depositAmount": extraction.deposit_amount,
                "extractedTenantName": extraction.tenant_name,
                "extractedPropertyAddress": extraction.property_address,
                "extractionConfidence": extraction.confidence,
                "extractionStatus": "needs_review" if extraction.needs_review else "completed",
            },
        )
        await client.mutation("files:markFileReady", {"fileId": event.lease_file_id})

        approval_id: str | None = None
        status = "completed"
        if extraction.needs_review:
            approval = await client.mutation(
                "leases:submitLeaseExtractionForReview",
                {
                    "leaseId": lease_id,
                    "requestedByRunId": agent_run_id,
                    "summary": extraction.summary,
                    "details": "Confirm extracted lease terms before activating workflow automation.",
                },
            )
            approval_id = approval["approvalId"]
            status = "waiting_for_approval"
        else:
            await client.mutation(
                "leases:confirmLeaseExtraction",
                {"leaseId": lease_id, "decidedByMembershipId": None},
            )

        await client.mutation(
            "agentRuns:completeAgentRun",
            {
                "agentRunId": agent_run_id,
                "outputSummary": f"Created lease {lease_id} with status {status}.",
            },
        )

        return AgentResult(
            agent="ContractAgent",
            event_id=event.event_id,
            status=status,
            target_id=lease_id,
            approval_id=approval_id,
            summary=extraction.summary,
            details=extraction.model_dump(),
        )
    except Exception as exc:
        await client.mutation("files:markFileFailed", {"fileId": event.lease_file_id})
        await client.mutation(
            "agentRuns:failAgentRun",
            {"agentRunId": agent_run_id, "error": str(exc), "outputSummary": "Contract upload failed."},
        )
        raise
