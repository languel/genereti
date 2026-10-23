"""ꘇ mediamime: the OSC encoder and its destinations, the relay routes, and the node's outputs."""
import asyncio
import importlib.util
import json
from pathlib import Path
import socket
import struct
import sys
from types import SimpleNamespace, ModuleType
import unittest
from unittest.mock import patch

from aiohttp import web

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'integrations/genereti_comfy_mediamime'


def load_osc():
    spec = importlib.util.spec_from_file_location('mediamime_osc', PACK / 'osc.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class OscTests(unittest.TestCase):
    def test_encoding_matches_the_spec(self):
        osc = load_osc()
        # "/a" + ",fi" + float 0.5 + int 7, every part padded to four bytes
        self.assertEqual(osc.encode('/a', [0.5, 7]), b'/a\0\0,fi\0' + struct.pack('>f', 0.5) + struct.pack('>i', 7))
        self.assertEqual(osc.encode('/x', [True, False, 'hi']), b'/x\0\0,TFs\0\0\0\0hi\0\0')
        self.assertEqual(len(osc.encode('/abc', [])) % 4, 0)

    def test_bad_addresses_and_arguments_are_refused(self):
        osc = load_osc()
        for bad in ['abc', '/a b', '/' + 'x' * 300, '']:
            with self.assertRaises(ValueError):
                osc.encode(bad, [])
        with self.assertRaises(ValueError):
            osc.encode('/a', [{'no': 1}])

    def test_only_local_and_private_destinations(self):
        osc = load_osc()
        self.assertTrue(osc.allowed_host('127.0.0.1'))
        self.assertTrue(osc.allowed_host('192.168.1.20'))
        self.assertTrue(osc.allowed_host('10.0.0.5'))
        self.assertFalse(osc.allowed_host('8.8.8.8'))
        self.assertFalse(osc.allowed_host('not a host name'))

    def test_a_message_arrives_over_udp(self):
        osc = load_osc()
        receiver = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        receiver.bind(('127.0.0.1', 0))
        receiver.settimeout(2)
        sender = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        osc.send(sender, '127.0.0.1', receiver.getsockname()[1], '/belly', [0.25, 3])
        data, _ = receiver.recvfrom(1024)
        self.assertEqual(data, osc.encode('/belly', [0.25, 3]))
        with self.assertRaises(ValueError):
            osc.send(sender, '8.8.8.8', 9000, '/x', [])
        receiver.close(); sender.close()


class PackTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        def kind(name):
            return SimpleNamespace(Input=lambda *a, **kw: kw, Output=lambda **kw: name)
        io = SimpleNamespace(ComfyNode=object, Schema=lambda **kw: SimpleNamespace(**kw), String=kind('STRING'), Image=kind('IMAGE'), Custom=lambda name: kind(name),
                             NodeOutput=lambda *values: values)
        latest = ModuleType('comfy_api.latest'); latest.io = io; latest.ComfyExtension = object
        routes = web.RouteTableDef()
        modules = {'comfy_api': ModuleType('comfy_api'), 'comfy_api.latest': latest,
                   'server': SimpleNamespace(PromptServer=SimpleNamespace(instance=SimpleNamespace(routes=routes)))}
        spec = importlib.util.spec_from_file_location('genereti_comfy_mediamime', PACK / '__init__.py', submodule_search_locations=[str(PACK)])
        cls.module = importlib.util.module_from_spec(spec)
        sys.modules['genereti_comfy_mediamime'] = cls.module
        with patch.dict(sys.modules, modules):
            spec.loader.exec_module(cls.module)
        cls.routes = routes

    def test_the_node_outputs_image_events_and_score(self):
        node = self.module.GeneretiMediamime
        self.assertEqual(node.define_schema().outputs, ['IMAGE', 'STRING', 'STRING', 'GENERETI_CHOP'])
        events = [{'name': 'belly', 'phase': 'entry'}]
        result = node.execute('{"version":1}', json.dumps({'events': events, 'channels': {'belly.active': 1}}), 'body', image='IMG')
        self.assertEqual(result[0], 'IMG')
        self.assertEqual(result[3]['channels'], {'belly.active': [1]})
        self.assertEqual(json.loads(result[1]), events)
        self.assertEqual(result[2], '{"version":1}')
        self.assertEqual(node.execute('', '', 'body')[1], '[]')

    def test_the_relay_sends_osc_and_counts_clients(self):
        received = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        received.bind(('127.0.0.1', 0)); received.settimeout(2)
        port = received.getsockname()[1]
        handler = next(r.handler for r in self.routes if r.path == '/genereti/mediamime/emit')

        class Request:
            async def json(self_inner):
                return {'messages': [{'kind': 'osc', 'host': '127.0.0.1', 'port': port, 'address': '/hit', 'args': [1]},
                                     {'kind': 'osc', 'host': '8.8.8.8', 'port': 9, 'address': '/no', 'args': []},
                                     {'kind': 'broadcast', 'payload': {'type': 'event'}}]}
        response = asyncio.run(handler(Request()))
        body = json.loads(response.text)
        self.assertEqual((body['sent'], body['errors']), (1, 1))
        self.assertEqual(received.recvfrom(1024)[0], load_osc().encode('/hit', [1]))
        received.close()

    def test_too_many_messages_are_refused(self):
        handler = next(r.handler for r in self.routes if r.path == '/genereti/mediamime/emit')

        class Request:
            async def json(self_inner):
                return {'messages': [{}] * 500}
        with self.assertRaises(web.HTTPBadRequest):
            asyncio.run(handler(Request()))


if __name__ == '__main__':
    unittest.main()
