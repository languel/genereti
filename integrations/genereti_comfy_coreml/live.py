"""Live inference hosted by Comfy; uses exactly the queued node's engine path."""
import asyncio
import base64
import io
import json
import math
from aiohttp import web
import numpy as np
import torch
from PIL import Image
from .nodes import generate as generate_frame, model_root, sizes, model_paths

_BUSY = asyncio.Lock()


def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Expected a JSON object.')
    result = {}
    for name, choices, default in [
        ('mode', ['text','image','sketch','canny','depth','pose'], 'sketch'),
        ('family', ['sdxs','sd_turbo'], 'sdxs')]:
        value = str(data.get(name, default))
        if value not in choices:
            raise ValueError(f'Invalid {name}; available: {", ".join(choices)}')
        result[name] = value
    prompt = data.get('prompt', '')
    if not isinstance(prompt, str) or len(prompt) > 2000:
        raise ValueError('Prompt must be text up to 2000 characters.')
    result['prompt'] = prompt
    path = data.get('model_path')
    if path not in model_paths() or model_paths()[path]['family'] != result['family']:
        raise ValueError('Invalid model path.')
    result['model_path'] = path
    result['invert'] = data.get('invert', False)
    if not isinstance(result['invert'], bool):
        raise ValueError('Invalid inversion choice.')
    seed = data.get('seed', 42)
    if isinstance(seed, bool) or not isinstance(seed, int) or not 0 <= seed <= 4294967295:
        raise ValueError('Invalid seed.')
    result['seed'] = seed
    for name, low, high, default in [('strength', .05, 1., .65), ('control_scale', 0., 65504., 1.), ('noise_phase', 0., 1e12, 0.)]:
        value = data.get(name, default)
        if isinstance(value, bool) or not isinstance(value, (int,float)) or not math.isfinite(value) or not low <= value <= high:
            raise ValueError(f'Invalid {name}.')
        result[name] = value
    result['preprocess'] = data.get('preprocess', True)
    if not isinstance(result['preprocess'], bool):
        raise ValueError('Invalid preprocessing choice.')
    source = data.get('image')
    if source is not None and (not isinstance(source, str) or len(source) > 2_800_000):
        raise ValueError('Invalid or oversized image.')
    result['image'] = source
    return result


def render(data):
    image = None
    if data['image'] is not None:
        raw = base64.b64decode(data['image'].split(',', 1)[-1], validate=True)
        with Image.open(io.BytesIO(raw)) as picture:
            if picture.width * picture.height > 16_000_000:
                raise ValueError('Input image is too large.')
            image = torch.from_numpy(np.asarray(picture.convert('RGBA'), dtype=np.float32).copy() / 255)[None]
    result = generate_frame(**{k:v for k,v in data.items() if k != 'image'}, image=image)
    buffer = io.BytesIO()
    pixels = (result[0][0].numpy().clip(0,1) * 255).astype(np.uint8)
    Image.fromarray(pixels).save(buffer, 'JPEG', quality=90)
    return buffer.getvalue(), json.loads(result[1])


def local_only(request):
    if request.remote not in ('127.0.0.1','::1'):
        raise web.HTTPForbidden(text='Native live inference is loopback-only.')


def register_routes(routes):
    @routes.get('/genereti/coreml/status')
    async def status(request):
        local_only(request)
        return web.json_response({'ready':bool(sizes()), 'size': int(sizes()[0]) if sizes() else 256,
            'model_root':str(model_root()), 'resolved_root':str(model_root().resolve()), 'sizes':sizes(),
            'model_paths':model_paths(), 'packages':{s:sorted(p.name for p in (model_root()/s).glob('*.mlpackage')) for s in sizes()}})

    @routes.post('/genereti/coreml/generate')
    async def generate(request):
        local_only(request)
        if _BUSY.locked():
            return web.json_response({'detail':'Native generator busy; pause other live producers.'}, status=429)
        if request.content_length and request.content_length > 3_000_000:
            raise web.HTTPRequestEntityTooLarge(max_size=3_000_000, actual_size=request.content_length)
        try:
            raw = bytearray()
            async for chunk in request.content.iter_chunked(65536):
                raw.extend(chunk)
                if len(raw) > 3_000_000:
                    raise ValueError('Request is too large.')
            data = validate(json.loads(raw))
        except (ValueError,TypeError) as exc:
            return web.json_response({'detail':str(exc)}, status=400)
        if _BUSY.locked():
            return web.json_response({'detail':'Native generator busy; pause other live producers.'}, status=429)
        async with _BUSY:
            # Await completion even if the browser disconnects: never launch a
            # second GPU request while a cancelled HTTP request still computes.
            task = asyncio.create_task(asyncio.to_thread(render, data))
            try:
                jpeg, metrics = await asyncio.shield(task)
            except asyncio.CancelledError:
                await task
                raise
            except (ValueError,FileNotFoundError) as exc:
                return web.json_response({'detail':str(exc)}, status=400)
            except Exception as exc:
                return web.json_response({'detail':f'Native generation failed: {str(exc)[:300]}'}, status=500)
            return web.Response(body=jpeg, content_type='image/jpeg', headers={
                'X-Inference-Ms':str(metrics['inference_ms']), 'X-Model-Size':str(metrics['size'])})
