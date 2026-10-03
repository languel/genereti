"""Drawing outputs preserve RGB, independent mask strength, SVG and scene JSON."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace, ModuleType
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image
from aiohttp import web

ROOT = Path(__file__).resolve().parents[1]


class DrawingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        def kind(name):
            return SimpleNamespace(Input=lambda *a, **kw: kw, Output=lambda **kw: name)
        io = SimpleNamespace(ComfyNode=object, Schema=lambda **kw: SimpleNamespace(**kw),
                             String=kind('STRING'), Image=kind('IMAGE'), Mask=kind('MASK'),
                             NodeOutput=lambda *values: values)
        latest = ModuleType('comfy_api.latest')
        latest.io = io
        latest.ComfyExtension = object
        modules = {'comfy_api': ModuleType('comfy_api'), 'comfy_api.latest': latest,
                   'folder_paths': SimpleNamespace(get_annotated_filepath=lambda path: path),
                   'server': SimpleNamespace(PromptServer=SimpleNamespace(instance=SimpleNamespace(routes=web.RouteTableDef())))}
        spec = importlib.util.spec_from_file_location('drawing_under_test', ROOT / 'integrations/genereti_comfy_drawing/__init__.py')
        cls.module = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, modules):
            spec.loader.exec_module(cls.module)

    def test_independent_image_mask_and_string_sockets(self):
        self.assertEqual(self.module.GeneretiDrawing.define_schema().outputs, ['IMAGE', 'MASK', 'STRING', 'STRING'])
        with tempfile.TemporaryDirectory() as temp:
            image = Path(temp) / 'image.png'
            mask = Path(temp) / 'mask.png'
            Image.new('RGB', (2, 1), (255, 0, 0)).save(image)
            Image.fromarray(np.array([[0, 128]], dtype=np.uint8)).save(mask)
            scene = json.dumps({'type': 'excalidraw', 'elements': [], 'genereti': {'imageFrameId': 'image', 'maskFrameId': 'mask'}})
            result = self.module.GeneretiDrawing.execute('', json.dumps({'image': str(image), 'mask': str(mask), 'svg': '<svg/>', 'json': scene}))
            self.assertEqual(tuple(result[0].shape), (1, 1, 2, 3))
            self.assertEqual(tuple(result[1].shape), (1, 1, 2))
            self.assertEqual(result[0][0, 0, 0].tolist(), [1, 0, 0])
            self.assertAlmostEqual(result[1][0, 0, 1].item(), 128 / 255, places=6)
            self.assertEqual(result[1][0, 0, 0].item(), 0)
            self.assertEqual(result[2:], ('<svg/>', scene))

    def test_missing_capture_fails_explicitly(self):
        with self.assertRaisesRegex(ValueError, 'drawing editor'):
            self.module.GeneretiDrawing.execute('', '')

    def test_text_only_outputs_need_no_raster_files(self):
        with patch.object(self.module.Image, 'open', side_effect=AssertionError('Unexpected raster load')):
            result = self.module.GeneretiDrawing.execute('', json.dumps({'outputs': ['SVG', 'JSON'], 'svg': '<svg/>', 'json': '{"elements":[]}'}))
        self.assertEqual(result, (None, None, '<svg/>', '{"elements":[]}'))

    def test_mask_only_output_needs_no_image(self):
        with tempfile.TemporaryDirectory() as temp:
            mask = Path(temp) / 'mask.png'
            Image.new('L', (2, 1), 128).save(mask)
            result = self.module.GeneretiDrawing.execute('', json.dumps({'outputs': ['MASK'], 'mask': str(mask)}))
            self.assertIsNone(result[0])
            self.assertEqual(tuple(result[1].shape), (1, 1, 2))
            self.assertAlmostEqual(result[1][0, 0, 0].item(), 128 / 255, places=6)
            self.assertEqual(result[2:], ('', ''))

    def test_transparent_image_preserves_alpha(self):
        with tempfile.TemporaryDirectory() as temp:
            image = Path(temp) / 'transparent.png'
            Image.new('RGBA', (1, 1), (0, 0, 0, 0)).save(image)
            result = self.module.GeneretiDrawing.execute('', json.dumps({'image': str(image)}))
            self.assertEqual(result[0][0, 0, 0].tolist(), [0, 0, 0, 0])

    def test_queued_preview_preserves_transparent_image(self):
        import ast
        import base64
        import io as bytes_io
        import time
        source = ast.parse((ROOT / 'integrations/genereti_comfy_stream/nodes.py').read_text())
        preview = next(node for node in source.body if isinstance(node, ast.ClassDef) and node.name == 'GeneretiLiveImagePreview')
        namespace = {'io': SimpleNamespace(ComfyNode=object, NodeOutput=lambda *args, **kwargs: (args, kwargs)),
                     'Image': Image, 'np': np, 'bytes_io': bytes_io, 'time': time, 'base64': base64}
        exec(compile(ast.Module(body=[preview], type_ignores=[]), '<preview>', 'exec'), namespace)
        pixels = self.module.torch.zeros((1, 2, 2, 4))
        args, kwargs = namespace['GeneretiLiveImagePreview'].execute(pixels)
        self.assertIs(args[0], pixels)
        data = kwargs['ui']['genereti_preview'][0]
        self.assertTrue(data.startswith('data:image/png;base64,'))
        with Image.open(bytes_io.BytesIO(base64.b64decode(data.split(',')[1]))) as image:
            self.assertEqual(image.mode, 'RGBA')
            self.assertEqual(image.getpixel((0, 0))[3], 0)

    def test_asset_escape_is_rejected(self):
        import asyncio
        with self.assertRaises(web.HTTPNotFound):
            asyncio.run(self.module.drawing_asset(SimpleNamespace(match_info={'asset': '../../../../AGENTS.md'})))
