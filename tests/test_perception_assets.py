import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import io
p=Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_perception/assets.py'
s=importlib.util.spec_from_file_location('perception_assets',p);assets=importlib.util.module_from_spec(s);s.loader.exec_module(assets)
class AssetsTests(unittest.TestCase):
    def test_only_fixed_task_assets(self):
        for task in assets.MODELS:
            self.assertEqual(len(assets.names(task)),6)
        with self.assertRaises(ValueError):assets.names('../../x')
        for entry in assets.CATALOG.values():
            self.assertTrue(entry['url'].startswith(('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/','https://storage.googleapis.com/mediapipe-models/')))
            self.assertEqual(len(entry['sha256']),64)
    def test_corrupt_download_removes_partial_and_has_no_receipt(self):
        with tempfile.TemporaryDirectory() as d,patch.object(assets.urllib.request,'urlopen',return_value=io.BytesIO(b'bad')):
            with self.assertRaises(ValueError):assets.download('segment',d)
            self.assertEqual(list(Path(d).iterdir()),[])
    def test_runtime_and_selected_model_receipt_required(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/'verified.json').write_text(json.dumps(assets.CATALOG))
            self.assertFalse(assets.installed('pose',root))
    def test_loopback_same_origin(self):
        from aiohttp import web
        class R:remote='127.0.0.1';host='localhost:8188';headers={'Origin':'http://localhost:8188'}
        assets.local_only(R())
        R.headers={'Origin':'http://evil.example'}
        with self.assertRaises(web.HTTPForbidden):assets.local_only(R())
if __name__=='__main__':unittest.main()
