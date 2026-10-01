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
