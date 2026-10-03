"""Run in Comfy Python with its core directory on PYTHONPATH."""
import importlib.util,json,unittest,tempfile
from pathlib import Path
from unittest.mock import patch
import torch
from PIL import Image
spec=importlib.util.spec_from_file_location('native_test',Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_coreml/nodes.py')
nodes=importlib.util.module_from_spec(spec);spec.loader.exec_module(nodes)
class FakeEngine:
 size=256
 def generate(self,prompt,**kwargs):self.arguments=kwargs;return Image.new('RGB',(3,2),'red'),{'inference_ms':1}
class NativeTests(unittest.TestCase):
 def setUp(self):
  self.engine=FakeEngine()
  self.patches=[patch.object(nodes.platform,'system',return_value='Darwin'),patch.object(nodes.platform,'machine',return_value='arm64'),patch.object(nodes.platform,'mac_ver',return_value=('14.0','','')),patch.object(nodes,'get_engine',return_value=self.engine),patch.object(nodes,'model_paths',return_value={'256/unet.mlpackage':dict(size='256',family='sdxs',style='base',modes=['text','sketch']),'256/turbo_unet.mlpackage':dict(size='256',family='sd_turbo',style='base',modes=['image','canny'])})]
  for p in self.patches:p.start();self.addCleanup(p.stop)
 def test_text_and_metrics(self):
  out=nodes.GeneretiSDXSGenerate.execute(model_path='256/unet.mlpackage',prompt='stage',mode='text')
  self.assertEqual(tuple(out[0].shape),(1,2,3,3));self.assertIsNone(self.engine.arguments['image']);self.assertEqual(json.loads(out[1])['family'],'sdxs')
 def test_invert_noise_and_alpha(self):
  nodes.GeneretiSDXSGenerate.execute(model_path='256/unet.mlpackage',prompt='stage',mode='sketch',image=torch.zeros((1,2,2,4)),invert=True,noise_phase=.25)
  self.assertEqual(self.engine.arguments['image'].getpixel((0,0)),(0,0,0));self.assertEqual(self.engine.arguments['noise_phase'],.25)
 def test_missing_image(self):
  with self.assertRaisesRegex(ValueError,'IMAGE input'):nodes.GeneretiSDTurboGenerate.execute(model_path='256/turbo_unet.mlpackage',prompt='stage',mode='image')
 def test_cross_family_rejected(self):
  with self.assertRaisesRegex(ValueError,'family'):nodes.GeneretiSDXSGenerate.execute(model_path='256/turbo_unet.mlpackage',prompt='stage',mode='image')
 def test_mode_rejected(self):
  with self.assertRaisesRegex(ValueError,'supports'):nodes.GeneretiSDXSGenerate.execute(model_path='256/unet.mlpackage',prompt='stage',mode='depth')
 def test_platform_guard(self):
  with patch.object(nodes.platform,'system',return_value='Linux'):
   with self.assertRaisesRegex(RuntimeError,'Apple silicon'):nodes.GeneretiSDXSGenerate.execute(model_path='256/unet.mlpackage',prompt='stage',mode='text')
 def test_family_schemas_remove_redundancy(self):
  for cls in (nodes.GeneretiSDXSGenerate,nodes.GeneretiSDTurboGenerate):
   schema=cls.define_schema();names=[i.id for i in schema.inputs]
   self.assertNotIn('pipeline',names);self.assertNotIn('style',names);self.assertNotIn('resolution',names)
   self.assertEqual('strength' in names,cls.family=='sd_turbo')
if __name__=='__main__':unittest.main()
