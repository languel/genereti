"""ꘇ poliplan: the Poliplan drawing editor as an interactive source node.

An image board and a mask board (the sizes are the node's width and height) become the IMAGE and MASK outputs, the
document the JSON, and the image board's vector drawing the SVG. An optional IMAGE input is shown under the image
board as a reference to draw over; it is not saved in the drawing, but while shown the IMAGE output is the drawing over it. Independent of the Core ML generator.
"""
import hashlib
import json
from pathlib import Path

import folder_paths
import numpy as np
import torch
from PIL import Image, ImageChops
from aiohttp import web
from server import PromptServer
from comfy_api.latest import ComfyExtension, io

ROOT = Path(__file__).resolve().parents[2]
VENDOR = ROOT / 'web/vendor/poliplan'


@PromptServer.instance.routes.get('/genereti/poliplan/{asset:.*}')
async def poliplan_asset(request):
    """The vendored Poliplan build (embed.html, its assets and the ams-editor.js client)."""
    root = VENDOR.resolve()
    path = (root / (request.match_info['asset'] or 'embed.html')).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(path, headers={'Cache-Control': 'no-cache'})


def _load(captured, key, mode):
    if not captured.get(key):
        return None
    with Image.open(folder_paths.get_annotated_filepath(captured[key])) as image:
        return image.convert(mode)


def _grey_mask(captured):
    """The mask board as 'L': white marks on transparent (or black) paper. Grey is weighted by alpha, so unpainted
    areas are 0 and antialiased edges stay soft."""
    image = _load(captured, 'mask', 'RGBA')
    return None if image is None else ImageChops.multiply(image.convert('L'), image.getchannel('A'))


def _tensor(array):
    return torch.from_numpy((np.asarray(array, dtype=np.float32) / 255.0).copy()).unsqueeze(0)


def _over_input(drawing, image):
    """The drawing laid over the input, which is fitted inside the board (contain, centred) like the editor's underlay."""
    w, h = drawing.size
    source = Image.fromarray((image[0].cpu().numpy()[..., :3] * 255).clip(0, 255).astype(np.uint8))
    scale = min(w / source.width, h / source.height)
    fitted = source.resize((max(1, round(source.width * scale)), max(1, round(source.height * scale))), Image.LANCZOS)
    base = Image.new('RGBA', (w, h), (255, 255, 255, 255))
    base.paste(fitted, ((w - fitted.width) // 2, (h - fitted.height) // 2))
    return Image.alpha_composite(base, drawing.convert('RGBA')).convert('RGB')


class GeneretiPoliplan(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id='GeneretiPoliplan', display_name='ꘇ poliplan',
            search_aliases=['Genereti Poliplan', 'Poliplan', 'Drawing', 'Painter'],
            category='Genereti / Interactive Sources',
            description='Poliplan drawing editor with an image board and a mask board. Queue outputs IMAGE and MASK '
                        'of the configured size, the image board as SVG, and the editable document as JSON. An optional '
                        'IMAGE input is shown under the image board to draw over; with the input shown the IMAGE output is the drawing composited over it.',
            inputs=[
                io.Image.Input('image', optional=True,
                               tooltip='Shown under the image board as a reference to draw over (follows a live source; freeze it upstream to hold it). Not saved in the drawing. While shown, the IMAGE output is the drawing over it; hide it to output the drawing alone.'),
                io.String.Input('poliplan', default='', socketless=True,
                                extra_dict={'widgetType': 'GENERETI_POLIPLAN'}),
                io.String.Input('capture', default='', socketless=True,
                                extra_dict={'widgetType': 'GENERETI_POLIPLAN_CAPTURE'}),
                io.Int.Input('width', default=512, min=64, max=4096, step=8,
                             tooltip='Width of the image and mask boards, in pixels.'),
                io.Int.Input('height', default=512, min=64, max=4096, step=8,
                             tooltip='Height of the image and mask boards, in pixels.'),
            ],
            outputs=[io.Image.Output(display_name='image'), io.Mask.Output(display_name='mask'),
                     io.String.Output(display_name='svg'), io.String.Output(display_name='json')],
        )

    @classmethod
    def execute(cls, poliplan, capture, width, height, image=None):
        if not capture:
            raise ValueError('Open the ꘇ poliplan editor before queueing.')
        captured = json.loads(capture)
        drawing = _load(captured, 'image', 'RGBA')
        pixels = mask = None
        if drawing is not None and captured.get('over') and image is not None:
            drawing = _over_input(drawing, image)
        if drawing is not None:
            # Preserve alpha for transparent drawings; opaque images stay RGB.
            mode = 'RGBA' if drawing.getchannel('A').getextrema()[0] < 255 else 'RGB'
            pixels = _tensor(drawing.convert(mode))
        grey = _grey_mask(captured)
        if grey is not None:
            mask = _tensor(grey)
        ui = {}
        if image is not None:
            # The frontend shows the input under the image board: a small PNG in Comfy's temp folder.
            preview = Image.fromarray((image[0].cpu().numpy()[..., :3] * 255).clip(0, 255).astype(np.uint8))
            digest = hashlib.sha1(preview.tobytes()).hexdigest()[:16]
            folder = Path(folder_paths.get_temp_directory()) / 'genereti-poliplan'
            folder.mkdir(parents=True, exist_ok=True)
            name = f'reference-{digest}.png'
            if not (folder / name).exists():
                preview.save(folder / name)
            ui = {'poliplan_reference': [{'filename': name, 'subfolder': 'genereti-poliplan', 'type': 'temp'}]}
        return io.NodeOutput(pixels, mask, captured.get('svg', ''), captured.get('json', ''), ui=ui)


class GeneretiPoliplanExtension(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiPoliplan]


async def comfy_entrypoint():
    return GeneretiPoliplanExtension()


WEB_DIRECTORY = './web'
