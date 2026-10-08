"""Interactive Excalidraw frame source; independent of the Core ML generator."""
import json
from pathlib import Path

import folder_paths
import numpy as np
import torch
from PIL import Image
from aiohttp import web
from server import PromptServer
from comfy_api.latest import ComfyExtension, io

ROOT = Path(__file__).resolve().parents[2]


@PromptServer.instance.routes.get('/genereti/drawing/{asset:.*}')
async def drawing_asset(request):
    asset = request.match_info['asset'] or 'index.html'
    root = (ROOT / 'web/vendor/excalidraw').resolve()
    if asset == 'index.html':
        return web.FileResponse(Path(__file__).parent / 'drawing.html')
    path = (root / asset).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise web.HTTPNotFound()
    return web.FileResponse(path)


class GeneretiDrawing(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id='GeneretiDrawing', display_name='ꘇ drawing',
            search_aliases=['Genereti Drawing', 'Excalidraw', 'Painter'],
            category='Genereti / Interactive Sources',
            description='Interactive Excalidraw image and mask frames. Queue outputs configured-size IMAGE/MASK, cropped SVG and editable scene JSON.',
            inputs=[
                io.String.Input('drawing', default='', socketless=True,
                                extra_dict={'widgetType': 'GENERETI_DRAWING'}),
                io.String.Input('capture', default='', socketless=True,
                                extra_dict={'widgetType': 'GENERETI_DRAWING_CAPTURE'}),
            ],
            outputs=[io.Image.Output(display_name='image'),io.Mask.Output(display_name='mask'),io.String.Output(display_name='svg'),io.String.Output(display_name='json')],
        )

    @classmethod
    def execute(cls, drawing, capture):
        if not capture:
            raise ValueError('Open the ꘇ drawing editor before queueing.')
        captured = json.loads(capture)
        pixels = mask = None
        if captured.get('image'):
            with Image.open(folder_paths.get_annotated_filepath(captured['image'])) as image:
                # Preserve alpha for transparent drawings; opaque images stay RGB.
                rgba = image.convert('RGBA')
                mode = 'RGBA' if rgba.getchannel('A').getextrema()[0] < 255 else 'RGB'
                pixels = torch.from_numpy((np.asarray(rgba.convert(mode), dtype=np.float32) / 255.0).copy()).unsqueeze(0)
        if captured.get('mask'):
            with Image.open(folder_paths.get_annotated_filepath(captured['mask'])) as image:
                mask = torch.from_numpy((np.asarray(image.convert('L'), dtype=np.float32) / 255.0).copy()).unsqueeze(0)
        return io.NodeOutput(pixels, mask,
                             captured.get('svg', ''), captured.get('json', ''))


class GeneretiDrawingExtension(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiDrawing]


async def comfy_entrypoint():
    return GeneretiDrawingExtension()


WEB_DIRECTORY = './web'
