import unittest
from unittest.mock import patch
from model_resolution import required_models,resolve_resolution
from server import Runtime,GenerateRequest
from fastapi import HTTPException

class ResolutionTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.catalog={'256':sorted(required_models('depth')|required_models('sketch')),
                      '512':sorted(required_models('sketch'))}
    def test_auto_keeps_compatible_current_size(self):
        self.assertEqual(resolve_resolution(self.catalog,512,'sketch'),512)
    def test_auto_selects_installed_mode_size(self):
        self.assertEqual(resolve_resolution(self.catalog,512,'depth'),256)
    def test_explicit_unsupported_size_has_available_sizes(self):
        with self.assertRaisesRegex(ValueError,'Available sizes: 256px'):
            resolve_resolution(self.catalog,512,'depth',requested=512)
    async def test_switch_failure_preserves_engine_size_output_and_accepts_next_frame(self):
        runtime=Runtime();original=object();runtime.engine=original;runtime.loading=None;runtime.size=512;runtime.jpeg=b'last'
        runtime.render=lambda data:(b'next',{'server_ms':1,'inference_ms':1})
        try:
            with patch.object(runtime,'model_catalog',return_value=self.catalog),patch.object(runtime,'available_sizes',return_value=[256,512]),patch.object(runtime,'build_engine',side_effect=RuntimeError('load failed')),patch('server.traceback.print_exc'):
                with self.assertRaises(HTTPException) as caught:
                    await runtime.generate(GenerateRequest(mode='depth'))
                self.assertEqual(caught.exception.status_code,400)
                self.assertIs(runtime.engine,original);self.assertEqual(runtime.size,512)
                self.assertEqual(runtime.jpeg,b'last');self.assertIsNone(runtime.loading);self.assertIsNone(runtime.error)
                await runtime.generate(GenerateRequest(mode='sketch'))
                self.assertEqual(runtime.jpeg,b'next')
        finally:runtime.executor.shutdown()
    async def test_resolution_and_render_run_under_same_lock(self):
        runtime=Runtime();runtime.engine=object();runtime.loading=None;runtime.size=512
        async def switch(size):
            self.assertTrue(runtime.lock.locked());runtime.size=size
        def render(data):
            self.assertTrue(runtime.lock.locked());self.assertEqual(runtime.size,256)
            return b'frame',{'server_ms':1,'inference_ms':1}
        runtime.render=render
        try:
            with patch.object(runtime,'model_catalog',return_value=self.catalog),patch.object(runtime,'_switch_size_locked',side_effect=switch):
                _,metrics=await runtime.generate(GenerateRequest(mode='depth'))
                self.assertEqual(metrics['resolved_resolution'],256)
        finally:runtime.executor.shutdown()

class ResolutionApiTests(unittest.TestCase):
    def test_http_auto_header_and_explicit_error_preserve_output(self):
        from fastapi.testclient import TestClient
        from server import app
        from types import SimpleNamespace
        runtime=Runtime();runtime.engine=SimpleNamespace(models={});runtime.loading=None;runtime.size=256
        runtime.render=lambda data:(b'jpeg',{'server_ms':1,'inference_ms':1})
        catalog={'256':sorted(required_models('depth')|required_models('sketch')),'512':sorted(required_models('sketch'))}
        try:
            with patch('server.runtime',runtime),patch.object(runtime,'model_catalog',return_value=catalog):
                client=TestClient(app)
                response=client.post('/api/generate',json={'mode':'depth','resolution':'auto'})
                self.assertEqual(response.status_code,200);self.assertEqual(response.headers['x-model-size'],'256')
                bad=client.post('/api/generate',json={'mode':'depth','resolution':512})
                self.assertEqual(bad.status_code,400);self.assertIn('256px',bad.json()['detail'])
                self.assertEqual(runtime.jpeg,b'jpeg');self.assertEqual(runtime.frame,1)
                self.assertEqual(client.get('/api/status').json()['resolution_handler'],True)
        finally:runtime.executor.shutdown()
