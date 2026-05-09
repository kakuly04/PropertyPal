from .tools.comms_tools import send_email_message, send_whatsapp_message


def looks_like_maintenance_request(body: str) -> bool:
    lowered = body.lower()
    keywords = [
        "leak",
        "leaking",
        "plumber",
        "electric",
        "broken",
        "repair",
        "maintenance",
        "sink",
        "tap",
        "toilet",
        "aircon",
        "ac",
        "water",
        "pipe",
        "light",
        "lock",
    ]
    return any(keyword in lowered for keyword in keywords)


def infer_trade(body: str) -> str:
    lowered = body.lower()

    if any(word in lowered for word in ["leak", "leaking", "tap", "sink", "toilet", "water", "pipe", "plumber"]):
        return "plumber"

    if any(word in lowered for word in ["electric", "light", "power", "switch"]):
        return "electrician"

    if any(word in lowered for word in ["clean", "cleaner"]):
        return "cleaner"

    return "contractor"


async def send_demo_maintenance_outreach(body: str, tenant_phone: str) -> dict[str, str]:
    trade = infer_trade(body)
    contractor_phone = "+6582638075"
    contractor_email = "tanvi.physics2021@gmail.com"
    tenant_contact = tenant_phone.removeprefix("whatsapp:")

    contractor_message = (
        "KeyAgent maintenance request: tenant reports "
        f"'{body}'. Trade needed: {trade}. "
        "Please reply with your earliest availability today or tomorrow."
    )
    tenant_message = (
        "KeyAgent received your maintenance request and is contacting the approved "
        f"{trade}. We will update you once availability is confirmed."
    )

    email_result = await send_email_message(
        contractor_email,
        f"Maintenance availability request: {trade}",
        contractor_message,
    )
    contractor_whatsapp_result = send_whatsapp_message(contractor_phone, contractor_message)
    tenant_whatsapp_result = send_whatsapp_message(tenant_contact, tenant_message)

    return {
        "trade": trade,
        "email": email_result,
        "contractor_whatsapp": contractor_whatsapp_result,
        "tenant_whatsapp": tenant_whatsapp_result,
    }
