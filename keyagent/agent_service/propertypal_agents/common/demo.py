from propertypal_agents.common.convex_client import convex
from propertypal_agents.common.types import DemoExternalFileEvent


async def ensure_demo_data() -> dict:
    client = convex()
    return await client.mutation("demoSeed:ensureDemoData", {})


async def resolve_demo_ids(org_id: str, property_id: str | None = None) -> tuple[str, str | None, dict | None]:
    if org_id != "demo":
        return org_id, property_id, None

    demo = await ensure_demo_data()
    return demo["orgId"], property_id or demo.get("propertyId"), demo


async def create_demo_external_file(event: DemoExternalFileEvent) -> str:
    client = convex()
    org_id, property_id, _demo = await resolve_demo_ids(event.org_id, event.property_id)
    if property_id is None:
        raise RuntimeError("Demo property ID could not be resolved.")

    return await client.mutation(
        "demoSeed:createDemoExternalFile",
        {
            "orgId": org_id,
            "propertyId": property_id,
            "externalUrl": event.external_url,
            "originalName": event.original_name,
            "contentType": event.content_type,
            "purpose": event.purpose,
        },
    )
