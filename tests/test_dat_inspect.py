import unittest
import numpy as np
import torch
from integrations.genereti_comfy_dat.inspect import Inspect,describe,display
class InspectTests(unittest.TestCase):
 def test_metadata_never_dumps_image(self):
  self.assertEqual(describe(torch.zeros(1,8,8,3))['shape'],[1,8,8,3])
  self.assertEqual(describe(np.arange(10),2)['samples'],[0,1])
 def test_schema_and_queue_value(self):
  Inspect.GET_SCHEMA();self.assertEqual(Inspect.RETURN_TYPES,['STRING'])
  result=Inspect.execute(input={'rms':.2}).result[0];self.assertIn('"rms": 0.2',result)
  self.assertEqual(display('hello','text'),'hello')
if __name__=='__main__':unittest.main()
