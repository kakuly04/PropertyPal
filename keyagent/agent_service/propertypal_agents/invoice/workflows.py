from propertypal_agents.common.convex_client import convex
from propertypal_agents.common.types import InvoiceReimbursedEvent


async def mark_reimbursed(event: InvoiceReimbursedEvent) -> dict:
    client = convex()
    return await client.mutation(
        "invoices:markInvoiceReimbursed",
        {
            "invoiceId": event.invoice_id,
            "reimbursedAt": event.reimbursed_at,
            "queueTenantConfirmation": event.queue_tenant_confirmation,
        },
    )
