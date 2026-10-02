"""Independent sender/receiver nodes using ComfyUI's V3 API."""
from .nodes import GeneretiStreams
async def comfy_entrypoint():
    return GeneretiStreams()

WEB_DIRECTORY = "./web"
