import importlib.util
import unittest
from pathlib import Path
import torch
spec=importlib.util.spec_from_file_location('texture_ops',Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_texture/ops.py')
ops=importlib.util.module_from_spec(spec);spec.loader.exec_module(ops)
class TextureTests(unittest.TestCase):
    def test_transparent_over(self):
        a=torch.tensor([[[[1.,0.,0.,.5]]]]);b=torch.tensor([[[[0.,0.,1.,.5]]]])
        self.assertTrue(torch.allclose(ops.composite(a,b),torch.tensor([[[[2/3,0.,1/3,.75]]]])))
        self.assertTrue(torch.allclose(ops.composite(a*0,b),b))
    def test_math_batch_and_alpha(self):
        a=torch.rand(2,8,6,4);b=torch.ones(1,4,3,3)*.5
        out=ops.arithmetic(a,b)
        self.assertEqual(out.shape,a.shape)
        self.assertTrue(torch.allclose(out[...,3:],a[...,3:]))
        self.assertTrue(torch.allclose(out[...,:3],a[...,:3]*.5))
    def test_negative_divisor(self):
        a=torch.ones(1,2,2,3)*.5
        self.assertEqual(ops.arithmetic(a,operation="divide",value=-1)[...,:3].sum().item(),0)

    def test_geometry_identity(self):
        a=torch.rand(2,8,6,4)
        for out in [ops.transform(a),ops.crop(a),ops.corner_pin(a,[(0,0),(1,0),(1,1),(0,1)])]:
            self.assertTrue(torch.allclose(a,out,atol=1e-5))
        self.assertTrue(torch.allclose(ops.transform(a,flip_x=True),a.flip(2),atol=1e-5))
    def test_outside_transparent_and_degenerate(self):
        a=torch.ones(1,8,6,3)
        self.assertEqual(ops.transform(a,translate_x=2).sum().item(),0)
        with self.assertRaises(ValueError):ops.corner_pin(a,[(0,0)]*4)
        with self.assertRaises(ValueError):ops.crop(a,left=.8,right=.2)
    def test_filters(self):
        a=torch.ones(1,8,8,4);a[...,0]=0
        self.assertTrue(torch.equal(ops.filter_image(a,'invert')[...,:3],1-a[...,:3]))
        self.assertTrue(torch.equal(ops.filter_image(a,'opacity',.5)[...,3:],a[...,3:]*.5))
        self.assertLess(ops.filter_image(a,'blur',1)[0,0,0,3].item(),1)
if __name__=='__main__':unittest.main()
