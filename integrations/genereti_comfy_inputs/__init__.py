"""Genereti ComfyUI nodes for selecting guide images and sharing a window."""

import folder_paths
import numpy as np
import torch
from PIL import Image
from comfy_api.latest import ComfyExtension, io, ui


def _load_capture(capture: str | None, source: str) -> torch.Tensor:
    if not capture or capture.startswith("GENERETI_OFF:"):
        raise ValueError(f"Select and start the {source} source before queueing this workflow.")
    path = folder_paths.get_annotated_filepath(capture)
    with Image.open(path) as image:
        pixels = np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0
    return torch.from_numpy(pixels.copy()).unsqueeze(0)


class GeneretiInputSelect(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id="GeneretiInputSelect",
            display_name="Genereti Input Source",
            category="Genereti / Local Core ML",
            description=(
                "Choose the guide image sent to Genereti. Doodle uses ComfyUI Painter, "
                "Webcam uses ComfyUI Webcam Capture, and Window / Screen uses the "
                "browser share node. Only the selected input is evaluated."
            ),
            inputs=[
                io.Combo.Input(
                    "source",
                    options=["Doodle", "Webcam", "Window / Screen"],
                    default="Doodle",
                    tooltip="Choose which connected image to send to Genereti.",
                ),
                io.Image.Input("doodle", optional=True, lazy=True, tooltip="Connect Painter here."),
                io.Image.Input("webcam", optional=True, lazy=True, tooltip="Connect Webcam Capture here."),
                io.Image.Input("screen", optional=True, lazy=True, tooltip="Connect Genereti Window / Screen Capture here."),
            ],
            outputs=[io.Image.Output(display_name="IMAGE")],
        )

    @classmethod
    def check_lazy_status(cls, source, doodle=None, webcam=None, screen=None):
        selected = {
            "Doodle": ("doodle", doodle),
            "Webcam": ("webcam", webcam),
            "Window / Screen": ("screen", screen),
        }.get(source)
        if selected is None:
            return []
        name, value = selected
        return [name] if value is None else []

    @classmethod
    def execute(cls, source, doodle=None, webcam=None, screen=None):
        selected = {
            "Doodle": doodle,
            "Webcam": webcam,
            "Window / Screen": screen,
        }.get(source)
        if selected is None:
            raise ValueError(f"Connect an IMAGE to the {source!r} input on Genereti Input Source.")
        return io.NodeOutput(selected, ui=ui.PreviewImage(selected, cls=cls))


class _GeneretiBrowserCapture(io.ComfyNode):
    capture_name = "input"
    widget_type = "GENERETI_BROWSER_CAPTURE"

    @classmethod
    def capture_input(cls):
        return io.String.Input(
            "capture",
            # A non-empty placeholder keeps Comfy's preflight validator from
            # treating an unconnected browser-side capture node as a missing
            # wire. The frontend replaces this with a fresh upload per queue.
            default=f"GENERETI_OFF:{cls.capture_name}",
            # Capture nodes are connected to lazy, mutually exclusive inputs.
            # The unselected source must not block queuing (for example, a
            # Doodle run should not require a camera or screen share).
            optional=True,
            socketless=True,
            extra_dict={"widgetType": cls.widget_type},
        )

    @classmethod
    def fingerprint_inputs(cls, capture=None):
        # The browser widget uploads a fresh [temp] filename on every queue.
        return capture or f"GENERETI_OFF:{cls.capture_name}"

    @classmethod
    def execute(cls, capture=None):
        image = _load_capture(capture, cls.capture_name)
        return io.NodeOutput(image, ui=ui.PreviewImage(image, cls=cls))


class GeneretiCameraCapture(_GeneretiBrowserCapture):
    capture_name = "Webcam"
    widget_type = "GENERETI_CAMERA_CAPTURE"

    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id="GeneretiCameraCapture",
            display_name="Genereti Webcam Capture",
            category="Genereti / Local Core ML",
            description="Start the selected camera with the top play control. GPU resize and horizontal flip apply before sampling; Queue uses the latest sampled frame.",
            inputs=[cls.capture_input()],
            outputs=[io.Image.Output(display_name="IMAGE")],
        )


class GeneretiScreenCapture(_GeneretiBrowserCapture):
    capture_name = "Window / Screen"
    widget_type = "GENERETI_SCREEN_CAPTURE"

    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id="GeneretiScreenCapture",
            display_name="Genereti Window / Screen Capture",
            category="Genereti / Local Core ML",
            description=(
                "Start sharing with the top play control. Choose a window, browser tab, or display; Queue uses the latest sampled frame. "
                "Capture is uploaded only when Window / Screen is the selected Genereti input."
            ),
            inputs=[cls.capture_input()],
            outputs=[io.Image.Output(display_name="IMAGE")],
        )


class GeneretiComfyInputs(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiInputSelect, GeneretiCameraCapture, GeneretiScreenCapture]


async def comfy_entrypoint():
    return GeneretiComfyInputs()


WEB_DIRECTORY = "./web"
