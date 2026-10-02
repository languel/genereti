"""A local, interactive p5.js sketch node that outputs its current canvas as IMAGE."""

import folder_paths
import numpy as np
import torch
from PIL import Image
from comfy_api.latest import ComfyExtension, io, ui


DEFAULT_SKETCH = """// Draw with the mouse. Press C to clear and change the palette with keys 1–5.
let hueShift = 0;

function setup() {
  createCanvas(512, 512);
  colorMode(HSB, 360, 100, 100, 100);
  background(225, 28, 12);
}

function draw() {
  noStroke();
  if (mouseIsPressed) {
    fill((hueShift + frameCount * 0.8) % 360, 78, 100, 62);
    circle(mouseX, mouseY, 34 + 18 * sin(frameCount * 0.12));
  }
  if (keyIsPressed) {
    fill((hueShift + 180) % 360, 70, 100, 55);
    circle(mouseX, mouseY, 14);
  }
}

function keyPressed() {
  if (key === 'c' || key === 'C') background(225, 28, 12);
  if (key >= '1' && key <= '5') hueShift = (Number(key) - 1) * 72;
  return false;
}
"""


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
        from .livecode_node import GeneretiLivecode
        return [GeneretiP5Sketch, GeneretiLivecode]


async def comfy_entrypoint():
    return GeneretiP5Extension()


WEB_DIRECTORY = "./web"
