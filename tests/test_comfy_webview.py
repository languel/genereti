"""The browser view must not rewrite text sent through a workflow."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace, ModuleType
import sys
import unittest
from unittest.mock import patch

class WebviewTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        latest = ModuleType('comfy_api.latest')
        latest.io = SimpleNamespace(ComfyNode=object,
            NodeOutput=lambda *values, **kw: SimpleNamespace(values=values, ui=kw['ui']))
        spec = importlib.util.spec_from_file_location('webview_under_test', Path(__file__).resolve().parents[1] / 'integrations/genereti_comfy_p5/document_node.py')
        cls.module = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {'comfy_api': ModuleType('comfy_api'), 'comfy_api.latest': latest}):
            spec.loader.exec_module(cls.module)

    def test_all_formats_preserve_source_bytes_and_ui_format(self):
        source = 'π\n<script>count++;</script>\n```mermaid\nA-->B\n```\n'
        for mode in ('markdown', 'html', 'text', 'url'):
            with self.subTest(mode=mode):
                result = self.module.GeneretiDocument.execute(mode, source)
                self.assertEqual(result.values, (source,))
                self.assertEqual(result.ui, {'genereti_document': [source], 'genereti_document_format': [mode]})
