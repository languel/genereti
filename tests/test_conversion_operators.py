"""Run with the Comfy venv and ComfyUI root on PYTHONPATH."""
import importlib.util
from pathlib import Path
import sys
import unittest
import numpy as np
import torch
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('conversion_pack',root/'integrations/genereti_comfy_dat/__init__.py',submodule_search_locations=[str(root/'integrations/genereti_comfy_dat')])
pack=importlib.util.module_from_spec(spec);sys.modules[spec.name]=pack;spec.loader.exec_module(pack)
c=sys.modules['conversion_pack.conversions']
class Conversions(unittest.TestCase):
    def test_rgba_roundtrip_and_batch(self):
        image=torch.rand(2,4,8,4)
        signal=c.TopToChop.execute(image,8,4,10,1).result[0]
        restored=c.ChopToTop.execute(signal,'rgba',8).result[0]
        self.assertTrue(torch.allclose(restored,image[1:2]))
        with self.assertRaises(ValueError):c.pixels(image,8,4,2)
    def test_rgb_alpha_and_dat_coordinates(self):
        image=torch.ones(1,2,3,3)*.5
        signal=c.TopToChop.execute(image,64,64,2,0).result[0]
        np.testing.assert_equal(signal['channels']['a'],np.ones(6))
        table=c.TopToDat.execute(image,3,2,2,0).result[0]['rows']
        self.assertEqual(table[0],['x','y','r','g','b','a']);self.assertEqual(table[-1][:2],['2','1'])
    def test_data_matrix_bounds_and_nonfinite(self):
        image=c.DatToTop.execute({'rows':[['head','head'],['.25','nan'],['2','invalid']]},True).result[0]
        self.assertEqual(tuple(image.shape),(1,2,2,4))
        np.testing.assert_equal(image[0,:,:,0].numpy(),[[.25,0],[1,0]])
        self.assertEqual(tuple(c.DatToTop.execute({'rows':[]},False).result[0].shape),(1,1,1,4))
        signal={'channels':{'a':np.array([1,.5]),'b':np.array([0,.2])}}
        self.assertEqual(tuple(c.ChopToTop.execute(signal,'channel_rows').result[0].shape),(1,2,2,4))
if __name__=='__main__':unittest.main()
