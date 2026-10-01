import base64
import io
import json
import urllib.error
import urllib.request
from urllib.parse import urlparse
from PIL import Image
import numpy as np
import torch


def request(base, path, payload=None):
    parsed = urlparse(base)
    if parsed.scheme not in ('http', 'https') or parsed.hostname not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Use a localhost Genereti server URL.')
    req = urllib.request.Request(base.rstrip('/') + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={'Content-Type': 'application/json'} if payload is not None else {})
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return response.read(), {k.lower(): v for k, v in response.headers.items()}
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'Genereti {exc.code}: {exc.read().decode()}') from exc
    except urllib.error.URLError as exc:
        raise RuntimeError('Start the Genereti server first.') from exc


def send(base, image, prompt, mode, resolution, seed, control_scale, options_json):
    options = json.loads(options_json or '{}')
    if not isinstance(options, dict):
        raise ValueError('Advanced options must be a JSON object.')
    state = json.loads(request(base, '/api/status')[0])
    if state['size'] != int(resolution):
        request(base, '/api/config/size', {'size': int(resolution)})
    pixels = (image[0].detach().cpu().numpy().clip(0, 1) * 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(pixels[..., :3]).save(buf, 'PNG')
    payload = {**options, 'prompt': prompt, 'mode': mode, 'style': options.get('style', 'base'),
        'seed': seed, 'control_scale': control_scale,
        'image': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}
    _, headers = request(base, '/api/generate', payload)
    frame = int(headers.get('x-frame', '0'))
    return frame, json.dumps({'frame': frame, 'inference_ms': float(headers.get('x-inference-ms', '0')),
        'server_ms': float(headers.get('x-server-ms', '0')), 'mode': mode, 'size': int(resolution)})


def receive(base, after_frame=0):
    data, headers = request(base, '/api/frame.jpg')
    frame = int(headers.get('x-frame', '0'))
    if after_frame and frame < after_frame:
        raise RuntimeError('Latest output is older than the requested frame. Send a frame first.')
    image = Image.open(io.BytesIO(data)).convert('RGB')
    tensor = torch.from_numpy(np.asarray(image, dtype=np.float32).copy() / 255)[None]
    return tensor, frame
