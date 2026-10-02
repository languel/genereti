"""Bounded, in-memory projector relay for separate browser profiles."""
import re
import time
from aiohttp import web

MAX_CHANNELS = 32
MAX_FRAME = 4 * 1024 * 1024
TTL = 60
channels = {}


def channel(request):
    token = request.match_info['token']
    if not re.fullmatch(r'[a-zA-Z0-9-]{16,80}', token):
        raise web.HTTPBadRequest(text='Invalid projector channel')
    now = time.monotonic()
    for key in list(channels):
        if now - channels[key]['touched'] > TTL:
            del channels[key]
    if token not in channels:
        if len(channels) >= MAX_CHANNELS:
            raise web.HTTPServiceUnavailable(text='Projector relay full')
        channels[token] = dict(frame=None, seq=0, viewer=0, touched=now)
    state = channels[token]
    state['touched'] = now
    return state


async def demand(request):
    state = channel(request)
    return web.json_response({'active': time.monotonic() - state['viewer'] < 3}, headers={'Cache-Control': 'no-store'})


async def publish(request):
    state = channel(request)
    if request.content_type != 'image/jpeg':
        raise web.HTTPUnsupportedMediaType()
    if request.content_length and request.content_length > MAX_FRAME:
        raise web.HTTPRequestEntityTooLarge(max_size=MAX_FRAME, actual_size=request.content_length)
    body = bytearray()
    async for chunk in request.content.iter_chunked(65536):
        body.extend(chunk)
        if len(body) > MAX_FRAME:
            raise web.HTTPRequestEntityTooLarge(max_size=MAX_FRAME, actual_size=len(body))
    if not body.startswith(b'\xff\xd8'):
        raise web.HTTPBadRequest(text='Expected JPEG frame')
    state['frame'] = bytes(body)
    state['seq'] += 1
    return web.Response(status=204)


async def receive(request):
    state = channel(request)
    state['viewer'] = time.monotonic()
    if not state['frame'] or request.query.get('after') == str(state['seq']):
        return web.Response(status=204, headers={'Cache-Control': 'no-store'})
    return web.Response(body=state['frame'], content_type='image/jpeg', headers={'Cache-Control':'no-store', 'X-Frame':str(state['seq'])})


def register(routes):
    routes.get('/genereti/projector/{token}/demand')(demand)
    routes.post('/genereti/projector/{token}/frame')(publish)
    routes.get('/genereti/projector/{token}/frame')(receive)
