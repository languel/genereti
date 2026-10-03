"""Run with Comfy Python, testing its local routes without model loading."""
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

root = Path(__file__).resolve().parents[1] / 'integrations/genereti_comfy_coreml'
package = types.ModuleType('native_route_test')
package.__path__ = [str(root)]
sys.modules[package.__name__] = package
spec = importlib.util.spec_from_file_location('native_route_test.live', root / 'live.py')
live = importlib.util.module_from_spec(spec)
spec.loader.exec_module(live)

class LiveTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.sizes = patch.object(live, 'sizes', return_value=['256'])
        self.sizes.start()
        self.catalog=patch.object(live,'model_paths',return_value={'256/unet.mlpackage':{'family':'sdxs'}});self.catalog.start()
        live._BUSY = __import__('asyncio').Lock()
        routes = web.RouteTableDef()
        live.register_routes(routes)
        app = web.Application()
        app.add_routes(routes)
        self.client = TestClient(TestServer(app))
        await self.client.start_server()

    async def asyncTearDown(self):
        await self.client.close()
        self.sizes.stop();self.catalog.stop()

    async def test_live_posts_return_own_encoded_frame(self):
        with patch.object(live, 'render', return_value=(b'jpeg', {'size':256,'inference_ms':12})) as render:
            response = await self.client.post('/genereti/coreml/generate', json={'model_path':'256/unet.mlpackage','mode':'text','prompt':'stage'})
            self.assertEqual(response.status, 200)
            self.assertEqual(await response.read(), b'jpeg')
            self.assertEqual(response.headers['X-Model-Size'], '256')
            self.assertEqual(render.call_args.args[0]['model_path'], '256/unet.mlpackage')

    async def test_busy_retries_instead_of_launching_second_producer(self):
        await live._BUSY.acquire()
        try:
            response = await self.client.post('/genereti/coreml/generate', json={'size':'256'})
            self.assertEqual(response.status, 429)
        finally:
            live._BUSY.release()

    async def test_invalid_model_and_nonfinite_influence_rejected(self):
        for payload in ({'model_path':'../../secret'}, {'model_path':'256/unet.mlpackage','control_scale':float('nan')}):
            response = await self.client.post('/genereti/coreml/generate', json=payload)
            self.assertEqual(response.status, 400)

if __name__ == '__main__':
    unittest.main()
