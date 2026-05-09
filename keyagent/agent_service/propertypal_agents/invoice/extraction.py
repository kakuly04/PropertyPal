from openai import AsyncOpenAI

from propertypal_agents.common.config import get_settings
from .prompts import INVOICE_EXTRACTION_PROMPT
from .schemas import InvoiceExtraction


async def extract_invoice(file_url: str) -> InvoiceExtraction:
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    response = await client.responses.parse(
        model=settings.openai_extraction_model,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": INVOICE_EXTRACTION_PROMPT},
                    {"type": "input_image", "image_url": file_url},
                ],
            }
        ],
        text_format=InvoiceExtraction,
    )

    parsed = response.output_parsed
    if parsed is None:
        raise RuntimeError("OpenAI did not return a parsed invoice extraction.")
    return parsed
