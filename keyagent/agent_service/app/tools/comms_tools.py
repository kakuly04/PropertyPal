from agents import function_tool
import httpx
from twilio.rest import Client

from ..settings import get_settings


def normalize_whatsapp_number(value: str) -> str:
    if value.startswith("whatsapp:"):
        return value
    return f"whatsapp:{value}"


def send_whatsapp_message(to: str, body: str) -> str:
    settings = get_settings()

    twilio_from = settings.resolved_twilio_whatsapp_from

    if not settings.twilio_account_sid or not settings.twilio_auth_token or not twilio_from:
        return "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM or TWILIO_WHATSAPP_NUMBER."

    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    message = client.messages.create(
        from_=normalize_whatsapp_number(twilio_from),
        to=normalize_whatsapp_number(to),
        body=body,
    )

    return f"WhatsApp sent to {to}. Twilio SID: {message.sid}"


async def send_email_message(to: str, subject: str, body: str) -> str:
    settings = get_settings()

    if not settings.resend_api_key:
        return "Resend is not configured. Set RESEND_API_KEY."

    from_email = "KeyAgent <onboarding@resend.dev>"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_email,
                "to": [to],
                "subject": subject,
                "text": body,
            },
        )

    if response.status_code >= 400:
        return f"Resend email failed with status {response.status_code}: {response.text}"

    return f"Email sent to {to}. Response: {response.text}"


@function_tool
async def send_email(to: str, subject: str, body: str) -> str:
    """Send an email through Resend."""
    return await send_email_message(to, subject, body)


@function_tool
async def send_whatsapp(to: str, body: str) -> str:
    """Send a WhatsApp message through Twilio."""
    return send_whatsapp_message(to, body)


@function_tool
async def call_with_voice(to: str, script: str) -> str:
    """Place an outbound voice call through ElevenLabs."""
    return f"TODO: place ElevenLabs voice call to {to}. Script: {script}"


@function_tool
async def create_calendar_event(title: str, attendees: list[str], proposed_time: str, description: str) -> str:
    """Create or stage a Google Calendar event for the scheduled maintenance visit."""
    return (
        "Calendar event staged for demo. "
        f"Title: {title}. Time: {proposed_time}. Attendees: {', '.join(attendees)}. "
        f"Description: {description}"
    )


@function_tool
async def poll_availability(parties: list[str], request: str) -> str:
    """Ask multiple parties for availability and summarize responses."""
    results = []

    for party in parties:
        results.append(send_whatsapp_message(party, request))

    return "Availability poll started. " + " ".join(str(result) for result in results)
