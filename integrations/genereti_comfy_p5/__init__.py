"""Livecode browser sources, including p5.js sketches."""
from comfy_api.latest import ComfyExtension


class GeneretiP5Extension(ComfyExtension):
    async def get_node_list(self):
        from .livecode_node import GeneretiLivecode, register_routes
        register_routes()
        return [GeneretiLivecode]


async def comfy_entrypoint():
    return GeneretiP5Extension()


WEB_DIRECTORY = "./web"
