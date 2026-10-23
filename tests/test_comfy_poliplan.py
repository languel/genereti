"""ꘇ poliplan: image, mask, SVG and JSON outputs; the optional input image shown and composited."""
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace, ModuleType
import unittest
from unittest.mock import patch

import numpy as np
import torch
from PIL import Image
from aiohttp import web

ROOT = Path(__file__).resolve().parents[1]


class PoliplanTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        def kind(name):
            return SimpleNamespace(Input=lambda *a, **kw: kw, Output=lambda **kw: name)
        io = SimpleNamespace(ComfyNode=object, Schema=lambda **kw: SimpleNamespace(**kw),
                             String=kind('STRING'), Image=kind('IMAGE'), Mask=kind('MASK'),
                             Int=kind('INT'), Boolean=kind('BOOLEAN'),
                             NodeOutput=lambda *values, ui=None: SimpleNamespace(values=values, ui=ui))
        latest = ModuleType('comfy_api.latest')
        latest.io = io
        latest.ComfyExtension = object
        folder_paths = SimpleNamespace(get_annotated_filepath=lambda path: path,
                                       get_temp_directory=lambda: cls.temp.name)
        modules = {'comfy_api': ModuleType('comfy_api'), 'comfy_api.latest': latest, 'folder_paths': folder_paths,
                   'server': SimpleNamespace(PromptServer=SimpleNamespace(instance=SimpleNamespace(routes=web.RouteTableDef())))}
        spec = importlib.util.spec_from_file_location('poliplan_under_test', ROOT / 'integrations/genereti_comfy_poliplan/__init__.py')
        cls.module = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, modules):
            spec.loader.exec_module(cls.module)
        cls.node = cls.module.GeneretiPoliplan

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def run_node(self, captured, image=None):
        return self.node.execute('', json.dumps(captured), 2, 1, image=image)

    def test_sockets_match_the_drawing_node(self):
        schema = self.node.define_schema()
        self.assertEqual(schema.outputs, ['IMAGE', 'MASK', 'STRING', 'STRING'])
        self.assertEqual(schema.node_id, 'GeneretiPoliplan')

    def test_missing_capture_fails_explicitly(self):
        with self.assertRaisesRegex(ValueError, 'poliplan editor'):
            self.node.execute('', '', 2, 1)

    def test_image_mask_svg_and_json(self):
        with tempfile.TemporaryDirectory() as temp:
            image, mask = Path(temp) / 'image.png', Path(temp) / 'mask.png'
            Image.new('RGB', (2, 1), (255, 0, 0)).save(image)
            Image.fromarray(np.array([[0, 128]], dtype=np.uint8)).save(mask)
            result = self.run_node({'image': str(image), 'mask': str(mask), 'svg': '<svg/>', 'json': '{"document":{}}'})
        pixels, grey, svg, text = result.values
        self.assertEqual(tuple(pixels.shape), (1, 1, 2, 3))
        self.assertEqual(pixels[0, 0, 0].tolist(), [1, 0, 0])
        self.assertAlmostEqual(grey[0, 0, 1].item(), 128 / 255, places=6)
        self.assertEqual((svg, text), ('<svg/>', '{"document":{}}'))
        self.assertEqual(result.ui, {})

    def test_transparent_mask_paper_is_black_and_edges_are_weighted_by_alpha(self):
        with tempfile.TemporaryDirectory() as temp:
            mask = Path(temp) / 'mask.png'
            board = Image.new('RGBA', (3, 1), (0, 0, 0, 0))   # transparent paper
            board.putpixel((1, 0), (255, 255, 255, 128))       # a soft white edge
            board.putpixel((2, 0), (255, 255, 255, 255))       # a solid white mark
            board.save(mask)
            result = self.node.execute('', json.dumps({'mask': str(mask)}), 3, 1)
        grey = result.values[1]
        self.assertEqual(grey[0, 0, 0].item(), 0.0)
        self.assertAlmostEqual(grey[0, 0, 1].item(), 128 / 255, places=2)
        self.assertEqual(grey[0, 0, 2].item(), 1.0)

    def test_text_only_outputs_need_no_raster_files(self):
        with patch.object(self.module.Image, 'open', side_effect=AssertionError('Unexpected raster load')):
            result = self.run_node({'svg': '<svg/>', 'json': '{}'})
        self.assertEqual(result.values, (None, None, '<svg/>', '{}'))

    def test_input_image_is_shown_under_the_board(self):
        source = torch.zeros((1, 1, 2, 3))
        source[..., 0] = 1.0
        with tempfile.TemporaryDirectory() as temp:
            image = Path(temp) / 'image.png'
            Image.new('RGBA', (2, 1), (0, 0, 0, 0)).save(image)
            result = self.run_node({'image': str(image)}, image=source)
        reference = result.ui['poliplan_reference'][0]
        self.assertEqual((reference['subfolder'], reference['type']), ('genereti-poliplan', 'temp'))
        self.assertTrue((Path(self.temp.name) / 'genereti-poliplan' / reference['filename']).is_file())
        # Never composited: the transparent drawing stays transparent.
        self.assertEqual(result.values[0][0, 0, 0].tolist(), [0, 0, 0, 0])

    def test_the_input_is_shown_under_the_board_but_never_composited(self):
        source = torch.zeros((1, 1, 2, 3))
        source[..., 2] = 1.0   # blue input
        with tempfile.TemporaryDirectory() as temp:
            image = Path(temp) / 'image.png'
            drawing = Image.new('RGBA', (2, 1), (0, 0, 0, 0))
            drawing.putpixel((0, 0), (255, 0, 0, 255))   # one opaque red pixel
            drawing.save(image)
            result = self.run_node({'image': str(image)}, image=source)
        pixels = result.values[0]
        self.assertEqual(tuple(pixels.shape), (1, 1, 2, 4))   # still RGBA: the transparent pixel stays transparent
        self.assertEqual(pixels[0, 0, 0].tolist(), [1, 0, 0, 1])
        self.assertEqual(pixels[0, 0, 1].tolist(), [0, 0, 0, 0])
        self.assertIn('poliplan_reference', result.ui.as_dict() if hasattr(result.ui, 'as_dict') else result.ui)

    def test_there_is_no_over_input_switch_any_more(self):
        inputs = self.node.define_schema().inputs
        self.assertEqual(len(inputs), 5)   # image, poliplan, capture, width, height
        self.assertFalse(any('over_input' in str(i.get('tooltip', '')) for i in inputs))


if __name__ == '__main__':
    unittest.main()
