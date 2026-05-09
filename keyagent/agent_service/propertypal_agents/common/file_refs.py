from .convex_client import ConvexClient


async def get_file_url(client: ConvexClient, file_id: str) -> str:
    file_doc = await client.query("files:getFile", {"fileId": file_id})
    if file_doc is None:
        raise RuntimeError(f"File not found: {file_id}")

    external_url = file_doc.get("externalUrl")
    if external_url:
        return external_url

    storage_id = file_doc.get("storageId")
    if not storage_id:
        raise RuntimeError(f"File is missing storageId: {file_id}")

    return await client.storage_url(storage_id)
