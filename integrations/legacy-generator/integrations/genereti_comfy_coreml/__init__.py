"""Opt-in in-process Core ML experiment; no HTTP generator dependency."""
from .nodes import GeneretiNativeExtension

async def comfy_entrypoint():
    return GeneretiNativeExtension()

# Imported by Comfy after its PromptServer exists; no external server starts.
from server import PromptServer
if getattr(PromptServer, 'instance', None) is not None:
    from .live import register_routes
    register_routes(PromptServer.instance.routes)

WEB_DIRECTORY = './web'
