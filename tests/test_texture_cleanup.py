import importlib.util
from pathlib import Path
import unittest
import torch

spec = importlib.util.spec_from_file_location('cleanup', Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_texture/cleanup.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
cleanup = module.cleanup


class CleanupTests(unittest.TestCase):
    def test_flat_rgba_and_batch_resize(self):
        image = torch.tensor([.2, .4, .6, .3]).expand(2, 7, 5, 4).clone()
        for method in ('bilinear', 'bicubic'):
            out = cleanup(image, 13, 11, method, .4, .12, .7, .2)
            self.assertEqual(out.shape, (2, 11, 13, 4))
            self.assertTrue(torch.allclose(out, image[:, :1, :1].expand_as(out), atol=1e-5))

    def test_no_hidden_color_fringe(self):
        image = torch.tensor([[[[1.,0.,0.,1.],[0.,1.,0.,0.]]]])
        for method in ('bilinear','bicubic'):
            out = cleanup(image,16,4,method)
            self.assertEqual(out[...,1].max().item(),0)
            self.assertTrue(torch.isfinite(out).all())
            self.assertTrue(((out>=0)&(out<=1)).all())

    def test_bilateral_reduces_grain_preserves_boundary(self):
        torch.manual_seed(2)
        image = torch.ones(1,32,32,3)*.2
        image[:,:,16:]=.8
        image += torch.randn_like(image)*.025
        out = cleanup(image,32,32,smoothing=1,color_threshold=.12)
        self.assertLess(out[:,2:-2,2:13,:3].std(), image[:,2:-2,2:13].std())
        self.assertGreater((out[:,:,16,:3]-out[:,:,15,:3]).mean(),.5)

    def test_antialias_changes_staircase_preserves_alpha(self):
        y,x=torch.meshgrid(torch.arange(16),torch.arange(16),indexing='ij')
        image=(x>y).float()[None,:,:,None].expand(1,16,16,3)
        out=cleanup(image,16,16,antialias=1)
        self.assertGreater(((out[...,:3]>0)&(out[...,:3]<1)).sum(),0)
        self.assertTrue(torch.equal(out[...,3],torch.ones(1,16,16)))

    def test_identity_and_sharpen_envelope(self):
        image=torch.rand(2,8,9,4)
        self.assertTrue(torch.equal(cleanup(image,9,8),image))
        out=cleanup(image,9,8,sharpen=.3)
        self.assertTrue(torch.equal(out[...,3],image[...,3]))
        self.assertTrue(((out>=0)&(out<=1)).all())

    def test_invalid_controls(self):
        image=torch.ones(1,2,2,3)
        for args in ({'width':0},{'height':4097},{'method':'fsr'},{'smoothing':float('nan')}):
            with self.assertRaises(ValueError):cleanup(image,**args)


if __name__=='__main__':unittest.main()
