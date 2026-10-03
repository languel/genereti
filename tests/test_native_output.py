"""Native window launch is user-started, local-only and bounded."""
import asyncio
import importlib.util
from pathlib import Path
import sys
from types import ModuleType
import unittest
from unittest.mock import patch
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

ROOT=Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_stream'
package=ModuleType('output_test_pack');package.__path__=[str(ROOT)]
sys.modules[package.__name__]=package
spec=importlib.util.spec_from_file_location('output_test_pack.native_output',ROOT/'native_output.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class Process:
    def __init__(self):self.returncode=None;self.ended=asyncio.Event()
    async def wait(self):await self.ended.wait();return self.returncode
    def terminate(self):self.returncode=0;self.ended.set()

class NativeOutputTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        module.sessions.clear();self.process=Process()
        app=web.Application();routes=web.RouteTableDef();module.register(routes);app.add_routes(routes)
        self.client=TestClient(TestServer(app));await self.client.start_server()
    async def asyncTearDown(self):
        self.process.terminate();await asyncio.sleep(0);module.sessions.clear();await self.client.close()
    async def launch(self):
        with patch.object(module.sys,'platform','darwin'),patch.object(module,'build',return_value='/cached/output'),patch.object(module.asyncio,'create_subprocess_exec',return_value=self.process) as run:
            response=await self.client.post('/genereti/native-output/open');self.assertEqual(response.status,200)
            token=(await response.json())['token'];self.assertIn('/genereti/native-output/'+token+'/view',run.call_args.args[1]);return '/genereti/native-output/'+token
    async def test_png_alpha_transport_fit_and_closed_window(self):
        base=await self.launch()
        response=await self.client.get(base+'/frame');self.assertEqual(response.status,204)
        png=b'\x89PNG\r\n\x1a\n'+b'alpha-test'
        response=await self.client.post(base+'/frame?fit=cover',data=png,headers={'Content-Type':'image/png'});self.assertEqual(response.status,204)
        response=await self.client.get(base+'/frame');self.assertEqual(await response.read(),png);self.assertEqual(response.headers['X-Fit'],'cover');self.assertEqual(response.content_type,'image/png')
        self.assertEqual((await self.client.get(base+'/frame?after=1')).status,204)
        self.assertTrue((await (await self.client.get(base+'/demand')).json())['active'])
        self.assertEqual((await self.client.delete(base)).status,204)
        await asyncio.sleep(0);self.assertEqual((await self.client.get(base+'/frame')).status,404)
    async def test_cross_origin_launch_refused(self):
        response=await self.client.post('/genereti/native-output/open',headers={'Origin':'https://example.org'})
        self.assertEqual(response.status,403);self.assertEqual(module.sessions,{})
    async def test_bad_frames_and_oversize_refused(self):
        base=await self.launch()
        self.assertEqual((await self.client.post(base+'/frame',data=b'bad',headers={'Content-Type':'image/png'})).status,400)
        with patch.object(module,'MAX_FRAME',8):
            self.assertEqual((await self.client.post(base+'/frame',data=b'\x89PNG\r\n\x1a\nextra',headers={'Content-Type':'image/png'})).status,413)
    async def test_remote_client_refused(self):
        from aiohttp.test_utils import make_mocked_request
        request=make_mocked_request('POST','/genereti/native-output/open')
        with self.assertRaises(web.HTTPForbidden):module.local(request)
