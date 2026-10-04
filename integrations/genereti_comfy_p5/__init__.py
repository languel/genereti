"""A local, interactive p5.js sketch node that outputs its current canvas as IMAGE."""

import folder_paths
import numpy as np
import torch
from PIL import Image
from comfy_api.latest import ComfyExtension, io, ui


DEFAULT_SKETCH = """function setup(){createCanvas(windowWidth,windowHeight);background(245)}function draw(){stroke(random(255));line(random(width),random(height),random(width),random(height));if(mouseIsPressed){noStroke();fill(random(255));circle(mouseX,mouseY,dist(mouseX,mouseY,pmouseX,pmouseY))}}"""


def _load_canvas(path: str) -> torch.Tensor:
    if not path or path.startswith("GENERETI_OFF:"):
        raise ValueError("Run the p5 sketch, then queue it to capture the current canvas.")
    image_path = folder_paths.get_annotated_filepath(path)
    with Image.open(image_path) as image:
        pixels = np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0
    return torch.from_numpy(pixels.copy()).unsqueeze(0)


class GeneretiP5Sketch(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id="GeneretiP5Sketch",
            display_name="Genereti p5.js Sketch",
            category="Genereti / Interactive Sources",
            description=(
                "Edit and run a p5.js sketch in the node, draw with mouse and keyboard, "
                "then queue to output the current canvas as IMAGE. This is a separate source node."
            ),
            inputs=[
                io.String.Input(
                    "sketch",
                    multiline=True,
                    default=DEFAULT_SKETCH,
                    socketless=True,
                    extra_dict={"widgetType": "GENERETI_P5_SKETCH"},
                ),
                io.Int.Input(
                    "canvas_revision",
                    default=0,
                    min=0,
                    max=2147483647,
                    step=1,
                    socketless=True,
                    extra_dict={"widgetType": "GENERETI_P5_REVISION"},
                ),
            ],
            outputs=[io.Image.Output(display_name="IMAGE")],
        )

    @classmethod
    def fingerprint_inputs(cls, sketch, canvas_revision):
        # The sketch source and debounced interaction revision both participate
        # in Comfy's Run (on change) cache key.
        return sketch, canvas_revision

    @classmethod
    def execute(cls, sketch, canvas_revision):
        image = _load_canvas(sketch)
        return io.NodeOutput(image, ui=ui.PreviewImage(image, cls=cls))


class GeneretiP5Extension(ComfyExtension):
    async def get_node_list(self):
        from .livecode_node import GeneretiLivecode, register_routes
        register_routes()
        return [GeneretiP5Sketch, GeneretiLivecode]


async def comfy_entrypoint():
    return GeneretiP5Extension()


WEB_DIRECTORY = "./web"
