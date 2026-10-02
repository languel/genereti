"""Transport behavior without importing ComfyUI or loading models."""
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import torch
from PIL import Image

spec = importlib.util.spec_from_file_location('stream_transport', Path(__file__).resolve().parents[1] / 'integrations/genereti_comfy_stream/transport.py')
transport = importlib.util.module_from_spec(spec)
spec.loader.exec_module(transport)

class TransportTests(unittest.TestCase):
    def test_send_honors_advanced_options_and_returns_ack(self):
        calls=[]
        def request(base,path,payload=None):
            calls.append((path,payload))
            if path=='/api/status':return json.dumps({'size':512}).encode(),{}
            return b'jpeg',{'x-frame':'17','x-inference-ms':'9','x-server-ms':'12'}
        with patch.object(transport,'request',side_effect=request):
            frame,metadata=transport.send('http://localhost:8765',torch.ones((1,2,2,3)),'ink wash','sketch','512',42,1.,'{"emboss":0.3}')
        self.assertEqual(frame,17)
        self.assertEqual(json.loads(metadata)['inference_ms'],9)
        self.assertEqual(calls[-1][1]['emboss'],.3)
        self.assertTrue(calls[-1][1]['image'].startswith('data:image/png;base64,'))
    def test_receive_rejects_old_frame(self):
        with patch.object(transport,'request',return_value=(b'',{'x-frame':'4'})):
            with self.assertRaisesRegex(RuntimeError,'older'):transport.receive('http://localhost:8765',5)
    def test_receive_tensor_shape(self):
        buffer=io.BytesIO();Image.new('RGB',(3,4),'white').save(buffer,'JPEG')
        with patch.object(transport,'request',return_value=(buffer.getvalue(),{'x-frame':'8'})):
            tensor,frame=transport.receive('http://localhost:8765')
        self.assertEqual(list(tensor.shape),[1,4,3,3]);self.assertEqual(frame,8)
    def test_remote_server_rejected(self):
        with self.assertRaises(ValueError):transport.request('https://example.org','/api/status')

class BusyHandlingTests(unittest.TestCase):
    def modules(self):
        spec = importlib.util.spec_from_file_location('legacy_bridge', Path(__file__).resolve().parents[1] / 'integrations/comfyui_genereti/__init__.py')
        bridge = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(bridge)
        return bridge, transport

    def call(self, module):
        if module is transport:
            return module.request('http://localhost:8765', '/api/generate', {})
        with patch.object(module,'_configure_resolution'):
            return module.GeneretiGenerate().generate('ink', 'sketch', 42, .8, .8)

    def busy(self):
        import urllib.error
        return urllib.error.HTTPError('http://localhost:8765/api/generate', 429, 'busy', {}, io.BytesIO(b'{"detail":"Generator is in use"}'))

    def test_brief_overlap_recovers(self):
        from unittest.mock import MagicMock
        buffer=io.BytesIO();Image.new('RGB',(2,2),'white').save(buffer,'JPEG')
        for module in self.modules():
            with self.subTest(module=module.__name__):
                response=MagicMock();response.__enter__.return_value=response
                response.read.return_value=buffer.getvalue();response.headers={}
                with patch.object(module.urllib.request,'urlopen',side_effect=[self.busy(),response]) as opened, patch.object(module.time,'sleep') as sleep:
                    self.call(module)
                    self.assertEqual(opened.call_count,2)
                    sleep.assert_called_once_with(.15)

    def test_persistent_busy_is_bounded_and_actionable(self):
        for module in self.modules():
            with self.subTest(module=module.__name__):
                with patch.object(module.urllib.request,'urlopen',side_effect=[self.busy() for _ in range(4)]) as opened, patch.object(module.time,'sleep') as sleep:
                    with self.assertRaisesRegex(RuntimeError,'Pause Start live'):
                        self.call(module)
                    self.assertEqual(opened.call_count,4)
                    self.assertEqual(sleep.call_count,3)

class ModelResolutionTests(unittest.TestCase):
    def setUp(self):
        self.bridge=BusyHandlingTests().modules()[0]
    def select(self,mode,resolution='auto',catalog=False):
        from unittest.mock import MagicMock
        state={'size':512,'available_models':['unet','encoder','decoder','controlled_unet']}
        if catalog:state['models_by_size']={'512':state['available_models'],'256':state['available_models']+['turbo_unet','turbo_residual_unet','control_canny','control_depth','control_pose']}
        response=MagicMock();response.__enter__.return_value=response
        response.read.return_value=json.dumps(state).encode()
        with patch.object(self.bridge.urllib.request,'urlopen',return_value=response) as opened:
            self.bridge._configure_resolution(mode,'base',resolution)
            return opened.call_args_list
    def test_turbo_modes_choose_256_on_older_server(self):
        for mode in ('image','canny','depth','pose'):
            calls=self.select(mode)
            self.assertEqual(json.loads(calls[-1].args[0].data)['size'],256)
    def test_catalog_selects_supported_size(self):
        self.assertEqual(json.loads(self.select('depth',catalog=True)[-1].args[0].data)['size'],256)
    def test_sketch_keeps_512(self):
        self.assertEqual(len(self.select('sketch')),1)
    def test_explicit_unsupported_size_reports_action(self):
        with self.assertRaisesRegex(RuntimeError,'Choose auto'):self.select('image','512')
