import ast
from pathlib import Path
from types import SimpleNamespace
import unittest
import base64
import io as bytes_io
import time
import numpy as np
import torch
from PIL import Image

class CompareTests(unittest.TestCase):
    def test_queued_comparison_preserves_both_batches_and_sends_separate_previews(self):
        source=ast.parse((Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_stream/nodes.py').read_text())
        classes=[n for n in source.body if isinstance(n,ast.ClassDef) and n.name in ('GeneretiLiveImagePreview','GeneretiImageCompare')]
        namespace={'io':SimpleNamespace(ComfyNode=object,NodeOutput=lambda *values,**kw:SimpleNamespace(values=values,ui=kw['ui'])), 'Image':Image,'np':np,'time':time,'base64':base64,'bytes_io':bytes_io}
        exec(compile(ast.Module(body=classes,type_ignores=[]),'<streams>','exec'),namespace)
        a=torch.zeros((2,5,10,3));a[...,0]=1
        b=torch.zeros((3,10,5,4));b[...,2]=1;b[...,3]=.5
        result=namespace['GeneretiImageCompare'].execute(a,b)
        self.assertIs(result.values[0],a);self.assertIs(result.values[1],b)
        for key,expected in [('genereti_compare_a',(10,5)),('genereti_compare_b',(5,10))]:
            data=result.ui[key][0]
            with Image.open(bytes_io.BytesIO(base64.b64decode(data.split(',')[1]))) as image:
                self.assertEqual(image.size,expected)
                if key.endswith('_b'):self.assertEqual(image.getpixel((0,0))[3],127)

class MediaTests(unittest.TestCase):
    def test_media_snapshot_preserves_alpha_and_connected_images_preserve_batches(self):
        import tempfile
        from io import BytesIO
        source=ast.parse((Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_inputs/__init__.py').read_text())
        node=next(n for n in source.body if isinstance(n,ast.ClassDef) and n.name=='GeneretiMediaStream')
        namespace={'_GeneretiBrowserCapture':object,'torch':torch,'np':np,'Image':Image,'BytesIO':BytesIO,'base64':base64,
            'folder_paths':SimpleNamespace(get_annotated_filepath=lambda path:path),
            'io':SimpleNamespace(NodeOutput=lambda *values,**kw:SimpleNamespace(values=values,ui=kw['ui']))}
        exec(compile(ast.Module(body=[node],type_ignores=[]),'<media>','exec'),namespace)
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'frame.png';Image.new('RGBA',(8,4),(25,90,210,128)).save(path)
            result=namespace['GeneretiMediaStream'].execute(str(path))
            self.assertEqual(tuple(result.values[0].shape),(1,4,8,4))
            self.assertAlmostEqual(float(result.values[0][0,0,0,3]),128/255,places=6)
        batch=torch.zeros((3,4,8,3))
        result=namespace['GeneretiMediaStream'].execute('GENERETI_OFF:2D stream',batch)
        self.assertIs(result.values[0],batch)
