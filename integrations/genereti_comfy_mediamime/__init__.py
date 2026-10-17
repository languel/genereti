"""ꘇ mediamime: regions on the body that send MIDI, OSC, WebSocket messages and Genereti events.

The work happens in the browser, on the shared perception streams (ꘇ mediapipe.stream): the node draws regions with the
Poliplan editor over the incoming picture, tracks landmarks through them, and sends. This pack serves what the browser cannot do
itself: OSC as UDP, and a WebSocket other programs can connect to for the events. Independent of the Core ML generator.
"""
import asyncio
import json
import socket
from pathlib import Path

from aiohttp import web, WSMsgType
from server import PromptServer
from comfy_api.latest import ComfyExtension, io

from . import osc

ROUTES = PromptServer.instance.routes
CHOP = io.Custom('GENERETI_CHOP')
CLIENTS = set()
_udp = None


def _socket():
    global _udp
    if _udp is None:
        _udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    return _udp


async def broadcast(payload):
    text = json.dumps(payload, separators=(',', ':'))
    for client in list(CLIENTS):
        try:
            await client.send_str(text)
        except ConnectionError:
            CLIENTS.discard(client)


@ROUTES.post('/genereti/mediamime/emit')
async def emit(request):
    """Messages from the browser: { messages: [{ kind: 'osc', host, port, address, args } | { kind: 'broadcast', payload }] }."""
    try:
        body = await request.json()
        messages = body['messages']
        if not isinstance(messages, list) or len(messages) > osc.MAX_MESSAGES:
            raise ValueError('Send up to %d messages' % osc.MAX_MESSAGES)
    except (ValueError, KeyError, json.JSONDecodeError) as error:
        raise web.HTTPBadRequest(text=str(error))
    sent = errors = 0
    for message in messages:
        try:
            if message.get('kind') == 'osc':
                osc.send(_socket(), str(message['host']), int(message['port']), str(message['address']), message.get('args', []))
                sent += 1
            elif message.get('kind') == 'broadcast':
                await broadcast(message['payload'])
        except (ValueError, KeyError, TypeError, OSError):
            errors += 1
    return web.json_response({'sent': sent, 'errors': errors, 'clients': len(CLIENTS)})


@ROUTES.get('/genereti/mediamime/ws')
async def clients(request):
    """Other programs connect here (ws://127.0.0.1:8188/genereti/mediamime/ws) and receive every region event as JSON."""
    ws = web.WebSocketResponse(heartbeat=20)
    await ws.prepare(request)
    CLIENTS.add(ws)
    try:
        async for message in ws:
            if message.type == WSMsgType.ERROR:
                break
    finally:
        CLIENTS.discard(ws)
    return ws


@ROUTES.get('/genereti/mediamime/status')
async def status(request):
    return web.json_response({'clients': len(CLIENTS), 'osc': 'loopback and private networks'})


class GeneretiMediamime(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id='GeneretiMediamime', display_name='ꘇ mediamime',
            search_aliases=['Genereti Mediamime', 'Mediamime', 'regions', 'triggers', 'MIDI', 'OSC', 'homunculus'],
            category='Genereti / Perception',
            description='Draw regions over (or on) the body and send MIDI, OSC, WebSocket messages and Genereti events when '
                        'landmarks or the person cross them. Live in the browser, on shared perception streams.',
            inputs=[
                io.Image.Input('image', optional=True, tooltip='The picture the regions are drawn over (live).'),
                io.Image.Input('mask', optional=True, tooltip='A segmentation mask (live) for coverage regions.'),
                io.String.Input('mediamime', default='', socketless=True, extra_dict={'widgetType': 'GENERETI_MEDIAMIME'}),
                io.String.Input('capture', default='', socketless=True, extra_dict={'widgetType': 'GENERETI_MEDIAMIME_CAPTURE'}),
                io.String.Input('stream', default='body', tooltip='The perception stream with the landmarks (ꘇ mediapipe.stream).'),
            ],
            outputs=[io.Image.Output(display_name='image'), io.String.Output(display_name='events'), io.String.Output(display_name='score'), CHOP.Output(display_name='regions')],
        )

    @classmethod
    def execute(cls, mediamime, capture, stream, image=None, mask=None):
        try:
            state = json.loads(capture) if capture else {}
        except json.JSONDecodeError:
            state = {}
        channels = {key: [value] for key, value in (state.get('channels') or {}).items()}
        return io.NodeOutput(image, json.dumps(state.get('events', []), separators=(',', ':')), mediamime or '', {'channels': channels, 'sample_rate': 30, 'start': 0})


class GeneretiMediamimeExtension(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiMediamime]


async def comfy_entrypoint():
    return GeneretiMediamimeExtension()


WEB_DIRECTORY = './web'
