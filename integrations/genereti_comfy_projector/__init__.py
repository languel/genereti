"""A pass-through image node with a click-to-open projector window."""

from comfy_api.latest import ComfyExtension, io, ui


class GeneretiProjector(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id="GeneretiProjector",
            display_name='ꘇ Projector',search_aliases=['genereti', 'Projector', 'genereti Projector'],
            category="Genereti / Output",
            description=(
                "Pass an image through and open the latest queued image in a separate, "
                "screen-filling projector window. Use the button in the node to open it."
            ),
            inputs=[
                io.Image.Input("image"),
                io.String.Input(
                    "projector_controls",
                    default="",
                    socketless=True,
                    extra_dict={"widgetType": "GENERETI_PROJECTOR"},
                ),
            ],
            outputs=[io.Image.Output(display_name="IMAGE")],
        )

    @classmethod
    def execute(cls, image, projector_controls):
        return io.NodeOutput(image, ui=ui.PreviewImage(image, cls=cls))


class GeneretiProjectorExtension(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiProjector]


async def comfy_entrypoint():
    return GeneretiProjectorExtension()


WEB_DIRECTORY = "./web"

# Local transport works across browser profiles; frames are never saved.
from server import PromptServer
from .relay import register
register(PromptServer.instance.routes)
