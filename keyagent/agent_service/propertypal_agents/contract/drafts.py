from typing import Any

from propertypal_agents.common.types import RelistingDraftPreviewEvent


def build_relisting_draft_preview(event: RelistingDraftPreviewEvent) -> dict[str, Any]:
    headline = event.headline or f"For rent: {event.address}"
    details = [
        f"{event.bedrooms:g} bed" if event.bedrooms is not None else None,
        f"{event.bathrooms:g} bath" if event.bathrooms is not None else None,
        f"{event.floor_area:g} sqft" if event.floor_area is not None else None,
        event.furnishing,
    ]
    details = [detail for detail in details if detail]

    description = event.listing_description or "\n\n".join(
        part
        for part in [
            f"{headline}.",
            f"Available for rent at {event.currency} {event.new_rent_amount:,.0f} per month.",
            f"Available from {event.available_from}." if event.available_from else None,
            event.additional_notes,
        ]
        if part
    )

    copy_fields = {
        "headline": headline,
        "address": event.address,
        "listingType": "For Rent",
        "rent": f"{event.currency} {event.new_rent_amount:,.0f} / month",
        "availability": event.available_from,
        "details": " | ".join(details),
        "description": description,
    }
    copy_fields["fullListing"] = "\n\n".join(
        value for value in copy_fields.values() if isinstance(value, str) and value
    )

    return {
        "status": "draft_preview",
        "headline": headline,
        "address": event.address,
        "listingType": "for_rent",
        "rentAmount": event.new_rent_amount,
        "currency": event.currency,
        "availableFrom": event.available_from,
        "bedrooms": event.bedrooms,
        "bathrooms": event.bathrooms,
        "floorArea": event.floor_area,
        "furnishing": event.furnishing,
        "description": description,
        "copyFields": copy_fields,
    }
