"""Projector relay keeps only the latest frame and expires viewer demand."""
import importlib.util
from pathlib import Path
import unittest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

spec=importlib.util.spec_from_file_location('projector_relay',Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_projector/relay.py')
relay=importlib.util.module_from_spec(spec)
spec.loader.exec_module(relay)

class RelayTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        relay.channels.clear()
        routes=web.RouteTableDef();relay.register(routes)
        app=web.Application();app.add_routes(routes)
        self.client=TestClient(TestServer(app));await self.client.start_server()
        self.url='/genereti/projector/12345678-1234-1234-1234-123456789abc'

    async def asyncTearDown(self):
        await self.client.close()

    async def test_latest_frame_demand_and_sequence(self):
        response=await self.client.get(self.url+'/demand')
        self.assertFalse((await response.json())['active'])
        self.assertEqual((await self.client.get(self.url+'/frame')).status,204)
        response=await self.client.get(self.url+'/demand')
        self.assertTrue((await response.json())['active'])
        for suffix in [b'old',b'new']:
            self.assertEqual((await self.client.post(self.url+'/frame',data=b'\xff\xd8'+suffix,headers={'Content-Type':'image/jpeg'})).status,204)
        response=await self.client.get(self.url+'/frame')
        self.assertEqual(await response.read(),b'\xff\xd8new')
        self.assertEqual(response.headers['X-Frame'],'2')
        self.assertEqual((await self.client.get(self.url+'/frame?after=2')).status,204)
        relay.channels[self.url.split('/')[-1]]['viewer'] -= 4
        response=await self.client.get(self.url+'/demand')
        self.assertFalse((await response.json())['active'])

    async def test_invalid_frame_and_token(self):
        self.assertEqual((await self.client.get('/genereti/projector/bad/frame')).status,400)
        self.assertEqual((await self.client.post(self.url+'/frame',data=b'wrong',headers={'Content-Type':'image/jpeg'})).status,400)
