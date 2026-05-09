from openai import AsyncOpenAI

from propertypal_agents.common.config import get_settings
from .prompts import LEASE_EXTRACTION_PROMPT
from .schemas import LeaseExtraction


async def extract_lease(file_url: str) -> LeaseExtraction:
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    response = await client.responses.parse(
        model=settings.openai_extraction_model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": LEASE_EXTRACTION_PROMPT},
                    {"type": "input_file", "file_url": file_url},
                ],
            }
        ],
        text_format=LeaseExtraction,
    )

    parsed = response.output_parsed
    if parsed is None:
        raise RuntimeError("OpenAI did not return a parsed lease extraction.")
    return parsed


async def extract_lease_from_local_path(file_path: str) -> LeaseExtraction:
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    with open(file_path, "rb") as file:
        uploaded = await client.files.create(file=file, purpose="user_data")

    response = await client.responses.parse(
        model=settings.openai_extraction_model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": LEASE_EXTRACTION_PROMPT},
                    {"type": "input_file", "file_id": uploaded.id},
                ],
            }
        ],
        text_format=LeaseExtraction,
    )

    parsed = response.output_parsed
    if parsed is None:
        raise RuntimeError("OpenAI did not return a parsed lease extraction.")
    return parsed
