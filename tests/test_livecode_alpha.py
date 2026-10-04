"""Round-trip actual PNG alpha through the browser-result decoder."""
import ast
import base64
import io
import unittest
from pathlib import Path
import numpy as np
import torch
from PIL import Image
source=Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_p5/livecode_node.py'
body=[n for n in ast.parse(source.read_text()).body if isinstance(n,ast.FunctionDef) and n.name=='decode_image']
namespace={'base64':base64,'bytes_io':io,'np':np,'torch':torch,'Image':Image}
exec(compile(ast.Module(body=body,type_ignores=[]),str(source),'exec'),namespace)
class AlphaTests(unittest.TestCase):
    def test_transparent_and_opaque(self):
        for alpha,channels in [(128,4),(255,3)]:
            stream=io.BytesIO();Image.new('RGBA',(2,3),(255,0,0,alpha)).save(stream,format='PNG')
            result=namespace['decode_image']('data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode())
            self.assertEqual(result.shape,(1,3,2,channels))
            if channels==4:self.assertAlmostEqual(result[0,0,0,3].item(),128/255,places=6)
if __name__=='__main__':unittest.main()
