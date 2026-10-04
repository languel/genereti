"""Execute isolated browser code with this queue's image and scalar inputs."""
import asyncio
import base64
import io as bytes_io
import json
import uuid
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from aiohttp import web
from comfy_api.latest import io
from . import DEFAULT_SKETCH

LANGUAGES = json.loads((Path(__file__).parent / 'web/js/livecode-languages.json').read_text())

_pending = {}
_registered = False


def encode_image(image):
    if image is None:
        return None
    pixels = (image[0].detach().cpu().clamp(0, 1).numpy() * 255).round().astype(np.uint8)
    stream = bytes_io.BytesIO()
    Image.fromarray(pixels).save(stream, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode('ascii')


def decode_image(data):
    if not isinstance(data, str) or not data.startswith('data:image/png;base64,') or len(data) > 96_000_000:
        raise ValueError('Invalid Livecode PNG result')
    payload = base64.b64decode(data.split(',', 1)[1], validate=True)
    with Image.open(bytes_io.BytesIO(payload)) as image:
        if image.width > 4096 or image.height > 4096:
            raise ValueError('Livecode output exceeds 4096 pixels per side')
        rgba = image.convert('RGBA')
        transparent = rgba.getchannel('A').getextrema()[0] < 255
        pixels = np.asarray(rgba if transparent else image.convert('RGB'), dtype=np.float32) / 255
    return torch.from_numpy(pixels.copy()).unsqueeze(0)


def register_routes():
    global _registered
    if _registered:
        return
    from server import PromptServer
    if PromptServer.instance is None:
        return
    _registered = True

    @PromptServer.instance.routes.post('/genereti/livecode/result')
    async def result(request):
        data = await request.json()
        pending = _pending.get(data.get('request_id'))
        if pending is None:
            return web.json_response({'error': 'Render expired'}, status=410)
        future, client_id = pending
        if data.get('client_id') != client_id:
            return web.json_response({'error': 'Wrong workflow client'}, status=403)
        error = None
        output = None
        try:
            if data.get('error'):
                raise ValueError(str(data['error'])[:4000])
            output = decode_image(data.get('image'))
        except Exception as failure:
            error = failure
        # Comfy executes async nodes on a worker loop; HTTP runs on the server
        # loop. Wake the owning loop instead of mutating its Future directly.
        def finish():
            if not future.done():
                if error is not None:
                    future.set_exception(error)
                else:
                    future.set_result(output)
        future.get_loop().call_soon_threadsafe(finish)
        return web.json_response({'ok': True})


class GeneretiLivecode(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id='GeneretiLivecode', display_name='ꘇ livecode',
            search_aliases=['genereti', 'Genereti Livecode', 'livecode', 'live code', 'p5', 'GLSL', 'Three.js', 'Strudel', 'Tixy', 'Play Core', 'Manim', 'LaTeX', 'KaTeX', 'SVG', 'Orca', 'HyperFrames'],
            category='Genereti / Interactive Sources', not_idempotent=True,
            inputs=[
                io.Image.Input('image', optional=True, tooltip='Available as inputImage / __.image / u_image in code'),
                io.Combo.Input('language', options=LANGUAGES, default='p5'),
                io.Int.Input('width', default=512, min=64, max=4096, tooltip='Render width; windowWidth in p5 and __.render.width'),
                io.Int.Input('height', default=512, min=64, max=4096, tooltip='Render height; windowHeight in p5 and __.render.height'),
                io.Boolean.Input('auto_update', default=True),
                io.String.Input('code', default=DEFAULT_SKETCH, multiline=True, socketless=True, extra_dict={'widgetType':'GENERETI_LIVECODE'}),
                io.String.Input('parameters', default='{}', socketless=True, extra_dict={'widgetType':'GENERETI_LIVECODE_PARAMETERS'}),
                io.Autogrow.Input('controls', template=io.Autogrow.TemplatePrefix(
                    io.MultiType.Input('value', types=[io.Float,io.Int,io.Boolean,io.String]), prefix='value', min=0, max=64), optional=True),
            ], hidden=[io.Hidden.unique_id], outputs=[io.Image.Output(display_name='IMAGE')])

    @classmethod
    async def execute(cls, language, width, height, auto_update, code, parameters='{}', image=None, controls=None):
        from server import PromptServer
        server = PromptServer.instance
        client_id = server.client_id
        if not client_id:
            raise ValueError('Keep the Comfy workflow open in a browser to render Livecode.')
        params = json.loads(parameters)
        if not isinstance(params, dict):
            raise ValueError('Livecode parameters must be an object')
        request_id = uuid.uuid4().hex
        future = asyncio.get_running_loop().create_future()
        _pending[request_id] = (future, client_id)
        try:
            server.send_sync('genereti-livecode-render', {
                'request_id': request_id, 'node_id': str(cls.hidden.unique_id),
                'language': language, 'render': {'width': width, 'height': height},
                'code': code, 'parameters': params, 'controls': controls or {},
                'image': encode_image(image),
            }, sid=client_id)
            output = await asyncio.wait_for(future, timeout=30)
            return io.NodeOutput(output)
        except asyncio.TimeoutError as error:
            raise ValueError('Livecode render timed out. Keep this workflow open and check the node status.') from error
        finally:
            _pending.pop(request_id, None)
