"""User-started native output windows, bounded PNG frames over loopback only."""
import asyncio
import ipaddress
import sys
import time
import uuid
from aiohttp import web
from .native.build import build

MAX_FRAME = 16 * 1024 * 1024
MAX_WINDOWS = 8
sessions = {}
build_lock = asyncio.Lock()


def local(request):
    try:
        if not ipaddress.ip_address(request.remote or '').is_loopback:
            raise ValueError()
    except ValueError:
        raise web.HTTPForbidden(text='Native output is local only')
    origin = request.headers.get('Origin')
    if origin and origin != f'{request.scheme}://{request.host}':
        raise web.HTTPForbidden(text='Native output requires same-origin requests')


def session(request):
    local(request)
    token = request.match_info['token']
    state = sessions.get(token)
    if not state or state['process'].returncode is not None:
        sessions.pop(token, None)
        raise web.HTTPNotFound(text='Output window closed')
    return state


async def launch(request):
    local(request)
    if sys.platform != 'darwin':
        raise web.HTTPNotImplemented(text='Native Desktop output requires macOS 14+; browser windows and overlays remain available')
    for token, state in list(sessions.items()):
        if state['process'].returncode is not None:
            sessions.pop(token)
    if len(sessions) >= MAX_WINDOWS:
        raise web.HTTPServiceUnavailable(text='Close an output window before opening another')
    try:
        async with build_lock:
            if len(sessions) >= MAX_WINDOWS:
                raise web.HTTPServiceUnavailable(text='Close an output window before opening another')
            binary = await asyncio.to_thread(build)
            token = uuid.uuid4().hex
            # Construct our URL; clients cannot launch arbitrary URLs or commands.
            port = request.url.port or 80
            url = f'http://127.0.0.1:{port}/genereti/native-output/{token}/view'
            process = await asyncio.create_subprocess_exec(str(binary), url,
                        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
            sessions[token] = dict(process=process, frame=None, seq=0, viewer=0, fit='contain')
            asyncio.create_task(reap(token, process))
        return web.json_response({'token': token})
    except web.HTTPException:
        raise
    except Exception as error:
        raise web.HTTPServiceUnavailable(text=f'Could not launch native output: {error}. Install Xcode Command Line Tools for the first build.')


async def reap(token, process):
    await process.wait()
    sessions.pop(token, None)


async def receive(request):
    state = session(request)
    state['viewer'] = time.monotonic()
    headers = {'Cache-Control': 'no-store', 'X-Frame': str(state['seq']), 'X-Fit': state['fit']}
    if not state['frame'] or request.query.get('after') == str(state['seq']):
        return web.Response(status=204, headers=headers)
    return web.Response(body=state['frame'], content_type='image/png', headers=headers)


async def demand(request):
    state = session(request)
    return web.json_response({'active': time.monotonic() - state['viewer'] < 3})


async def publish(request):
    state = session(request)
    if request.content_type != 'image/png':
        raise web.HTTPUnsupportedMediaType()
    body = bytearray()
    async for chunk in request.content.iter_chunked(65536):
        body.extend(chunk)
        if len(body) > MAX_FRAME:
            raise web.HTTPRequestEntityTooLarge(max_size=MAX_FRAME, actual_size=len(body))
    if not body.startswith(b'\x89PNG\r\n\x1a\n'):
        raise web.HTTPBadRequest(text='Expected PNG')
    fit = request.query.get('fit', 'contain')
    if fit not in {'contain', 'cover', 'fill', 'native'}:
        raise web.HTTPBadRequest(text='Invalid fit')
    state.update(frame=bytes(body), seq=state['seq'] + 1, fit=fit)
    return web.Response(status=204)


async def close(request):
    state = session(request)
    state['process'].terminate()
    return web.Response(status=204)


async def view(request):
    session(request)
    from pathlib import Path
    return web.FileResponse(Path(__file__).parent / 'web/native-output.html')


def register(routes):
    routes.post('/genereti/native-output/open')(launch)
    routes.get('/genereti/native-output/{token}/view')(view)
    routes.get('/genereti/native-output/{token}/frame')(receive)
    routes.post('/genereti/native-output/{token}/frame')(publish)
    routes.get('/genereti/native-output/{token}/demand')(demand)
    routes.delete('/genereti/native-output/{token}')(close)
