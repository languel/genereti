"""Explicit, pinned optional downloads. No user media enters these routes."""
import asyncio
import hashlib
import json
import threading
import urllib.request
from pathlib import Path
from urllib.parse import urlparse
from aiohttp import web

CATALOG = json.loads(Path(__file__).with_name('assets.json').read_text())
MODELS = {'holistic': 'holistic.task', 'segment': 'selfie_segmenter.tflite', 'pose': 'pose.task', 'hands': 'hands.task', 'face': 'face.task', 'multiclass': 'selfie_multiclass.tflite'}
LOCK = threading.Lock()
TASKS = set()
STATE = {'phase': 'idle', 'done': 0, 'total': 0}

def cache_root():
    import folder_paths
    return Path(folder_paths.models_dir) / 'genereti/browser-perception'

def names(kind):
    if kind not in MODELS:
        raise ValueError('Unknown MediaPipe task')
    return [n for n in CATALOG if n.endswith(('.mjs', '.js', '.wasm'))] + [MODELS[kind]]

def installed(kind, root=None):
    root = Path(root) if root else cache_root()
    try:
        receipt = json.loads((root / 'verified.json').read_text())
        return all(receipt.get(n) == CATALOG[n] and (root / n).stat().st_size == CATALOG[n]['bytes'] for n in names(kind))
    except (OSError, ValueError, KeyError):
        return False

def download(kind, root=None):
    selected = names(kind)
    root = Path(root) if root else cache_root()
    root.mkdir(parents=True, exist_ok=True)
    STATE.update(phase='download', task=kind, done=0, total=sum(CATALOG[n]['bytes'] for n in selected), detail='')
    try:
        for name in selected:
            asset = CATALOG[name]; dest = root / name; tmp = root / (name + '.part')
            if dest.is_file() and dest.stat().st_size == asset['bytes'] and hashlib.sha256(dest.read_bytes()).hexdigest() == asset['sha256']:
                STATE['done'] += asset['bytes']; continue
            try:
                digest = hashlib.sha256(); size = 0
                with urllib.request.urlopen(asset['url'], timeout=60) as response, tmp.open('wb') as f:
                    while chunk := response.read(65536):
                        size += len(chunk)
                        if size > asset['bytes']: raise ValueError('Artifact exceeds declared size')
                        f.write(chunk); digest.update(chunk); STATE['done'] += len(chunk)
                if size != asset['bytes'] or digest.hexdigest() != asset['sha256']: raise ValueError('Artifact checksum mismatch: ' + name)
                tmp.replace(dest)
            finally:
                tmp.unlink(missing_ok=True)
        try: receipt = json.loads((root / 'verified.json').read_text())
        except (OSError, ValueError): receipt = {}
        receipt.update({n: CATALOG[n] for n in selected})
        (root / 'verified.part').write_text(json.dumps(receipt)); (root / 'verified.part').replace(root / 'verified.json')
        STATE.update(phase='ready')
    except Exception as error:
        STATE.update(phase='error', detail=str(error)); raise

def local_only(request):
    if request.remote not in ('127.0.0.1', '::1') or request.headers.get('Sec-Fetch-Site') == 'cross-site':
        raise web.HTTPForbidden(text='Browser perception assets are loopback-only')
    origin = request.headers.get('Origin')
    if origin and urlparse(origin).netloc != request.host:
        raise web.HTTPForbidden(text='Cross-origin downloads are not allowed')

def register_routes(routes):
    @routes.get('/genereti/perception/status')
    async def status(request):
        local_only(request)
        return web.json_response({**STATE, 'runtime': 'MediaPipe Tasks Vision 0.10.32', 'license': 'Apache-2.0', 'tasks': {k: {'installed': installed(k), 'bytes': sum(CATALOG[n]['bytes'] for n in names(k))} for k in MODELS}})
    @routes.post('/genereti/perception/download')
    async def install(request):
        local_only(request)
        try:
            raw = await request.content.read(1025)
            data = json.loads(raw)
            if len(raw) > 1024 or not isinstance(data, dict) or set(data) != {'task'}: raise ValueError('Expected one task')
            kind = data['task']; names(kind)
        except (ValueError, TypeError):
            raise web.HTTPBadRequest(text='Expected task: holistic, segment, multiclass, pose, hands or face')
        if not LOCK.acquire(blocking=False): raise web.HTTPConflict(text='Download already running')
        async def run():
            try: await asyncio.to_thread(download, kind)
            except Exception: pass
            finally: LOCK.release()
        job = asyncio.create_task(run()); TASKS.add(job); job.add_done_callback(TASKS.discard)
        return web.json_response({'started': True}, status=202)
    @routes.get('/genereti/perception/assets/{name}')
    async def asset(request):
        local_only(request); name = request.match_info['name']
        if name not in CATALOG: raise web.HTTPNotFound()
        root = cache_root(); path = root / name
        try:
            receipt = json.loads((root / 'verified.json').read_text())
            if receipt.get(name) != CATALOG[name] or hashlib.sha256(await asyncio.to_thread(path.read_bytes)).hexdigest() != CATALOG[name]['sha256']: raise ValueError()
        except (OSError, ValueError): raise web.HTTPNotFound(text='Download verified assets first')
        response = web.FileResponse(path)
        response.content_type = 'application/wasm' if name.endswith('.wasm') else 'text/javascript' if name.endswith(('.js', '.mjs')) else 'application/octet-stream'
        response.headers['Cache-Control'] = 'no-cache'
        return response
