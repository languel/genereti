import ast
from pathlib import Path
from types import SimpleNamespace
import unittest
import torch

class ProbeTests(unittest.TestCase):
    def test_probe_describes_tensor_without_copy_or_pixel_readback(self):
        tree=ast.parse((Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_stream/nodes.py').read_text())
        cls=next(n for n in tree.body if isinstance(n,ast.ClassDef) and n.name=='GeneretiPerformanceProbe')
        namespace={'io':SimpleNamespace(ComfyNode=object,NodeOutput=lambda **kw:kw)}
        exec(compile(ast.Module(body=[cls],type_ignores=[]),'<probe>','exec'),namespace)
        probe=namespace['GeneretiPerformanceProbe']
        tensor=torch.zeros((2,20,30,3))
        info=probe.execute(tensor)['ui']['genereti_probe'][0]
        self.assertEqual(info['shape'],[2,20,30,3]);self.assertEqual(info['bytes'],14400)
        info=probe.execute({'channels':{'x':[1,2,3]},'sampleRate':60})['ui']['genereti_probe'][0]
        self.assertEqual(info['channels'],1);self.assertEqual(info['samples'],{'x':3});self.assertEqual(info['sampleRate'],60)
