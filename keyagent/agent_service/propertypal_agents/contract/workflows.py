from datetime import date, timedelta

from propertypal_agents.common.convex_client import convex
from propertypal_agents.common.demo import resolve_demo_ids
from propertypal_agents.common.types import (
    LeaseExpiryCheckEvent,
    RelistingDraftApprovalEvent,
    RelistingDraftEvent,
    RelistingManuallyListedEvent,
    RenewalMeetingEvent,
)


async def run_lease_expiry_check(event: LeaseExpiryCheckEvent) -> dict:
    window_end = (date.today() + timedelta(days=event.days_ahead)).isoformat()
    client = convex()
    org_id, _property_id, _demo = await resolve_demo_ids(event.org_id)
    created = await client.mutation(
        "leases:createLeaseExpiryTasks",
        {
            "orgId": org_id,
            "endDateOnOrBefore": window_end,
            "limit": event.limit,
        },
    )
    return {"windowEndDate": window_end, "created": created}


async def queue_renewal_meeting(event: RenewalMeetingEvent) -> dict:
    client = convex()
    return await client.mutation(
        "leases:queueRenewalMeetingRequest",
        {
            "leaseId": event.lease_id,
            "taskId": event.task_id,
            "requestedByRunId": event.requested_by_run_id,
            "meetingSummary": event.meeting_summary,
        },
    )


async def create_relisting_draft(event: RelistingDraftEvent) -> dict:
    client = convex()
    return await client.mutation(
        "leases:createRelistingDraft",
        {
            "leaseId": event.lease_id,
            "taskId": event.task_id,
            "requestedByRunId": event.requested_by_run_id,
            "newRentAmount": event.new_rent_amount,
            "currency": event.currency,
            "availableFrom": event.available_from,
            "photoFileIds": event.photo_file_ids,
            "headline": event.headline,
            "bedrooms": event.bedrooms,
            "bathrooms": event.bathrooms,
            "floorArea": event.floor_area,
            "furnishing": event.furnishing,
            "listingDescription": event.listing_description,
            "additionalNotes": event.additional_notes,
        },
    )


async def approve_relisting_draft(event: RelistingDraftApprovalEvent) -> dict:
    client = convex()
    return await client.mutation(
        "leases:approveRelistingDraft",
        {
            "relistingDraftId": event.relisting_draft_id,
            "approvalId": event.approval_id,
            "decidedByMembershipId": event.decided_by_membership_id,
        },
    )


async def mark_relisting_manually_listed(event: RelistingManuallyListedEvent) -> dict:
    client = convex()
    return await client.mutation(
        "leases:markRelistingManuallyListed",
        {
            "relistingDraftId": event.relisting_draft_id,
            "manuallyListedByMembershipId": event.manually_listed_by_membership_id,
        },
    )
