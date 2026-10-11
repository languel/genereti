import importlib.util
from pathlib import Path
import sys
import types
import unittest
import torch

root=Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_texture'
pkg=types.ModuleType('utility_test_pack');pkg.__path__=[str(root)];sys.modules[pkg.__name__]=pkg
spec=importlib.util.spec_from_file_location(pkg.__name__+'.utilities',root/'utilities.py');u=importlib.util.module_from_spec(spec);spec.loader.exec_module(u)

class UtilityTests(unittest.TestCase):
    def test_identity_adjustments_and_alpha(self):
        a=torch.rand(2,7,8,4)
        outputs=[u.level(a,0,1,1,1,1,1,0,1),u.hsv(a,0,1,1),u.rgb(a,red_gain=1,green_gain=1,blue_gain=1,red_offset=0,green_offset=0,blue_offset=0),u.convolve(a,False,0,1,**{'k'+str(i):1 if i==4 else 0 for i in range(9)})]
        for out in outputs:self.assertTrue(torch.allclose(out,a,atol=1e-6))
        with self.assertRaises(ValueError):u.level(a,1,0,1,1,1,1,0,1)
    def test_hsv_wrap_and_color_maps(self):
        a=torch.tensor([[[[1.,0.,0.,.5]]]])
        self.assertTrue(torch.allclose(u.hsv(a,1/3,1,1),torch.tensor([[[[0.,1.,0.,.5]]]]),atol=1e-6))
        for palette in [*u.PALETTES,'rainbow']:
            out=u.colormap(a,palette,0,1,False,1);self.assertEqual(out[...,3].item(),.5);self.assertTrue(torch.isfinite(out).all())
    def test_edges_and_emboss_flat_and_edge(self):
        a=torch.ones(1,12,12,4);a[...,:3]=.4
        for alg in ['sobel','scharr','laplacian']:self.assertLess(u.edge(a,alg,1,0,False)[...,:3].max().item(),1e-6)
        self.assertTrue(torch.allclose(u.emboss(a,0,1,.5,1)[...,:3],torch.full_like(a[...,:3],.5)))
        a[:,:,6:,:3]=.9;self.assertGreater(u.edge(a,'sobel',1,0,False)[...,:3].max().item(),.1)
    def test_key_and_mask_transparency(self):
        a=torch.tensor([[[[0.,1.,0.,.5],[1.,0.,0.,.25]]]])
        keyed=u.key(a,'chroma',0,1,0,.1,.3,False,1,'image');self.assertEqual(keyed[0,0,0,3],0);self.assertEqual(keyed[0,0,1,3],.25)
        matte=u.key(a,'chroma',0,1,0,.1,.3,False,0,'matte');self.assertTrue(torch.equal(matte[...,3],torch.ones_like(matte[...,3])))
        mask=torch.tensor([[[[1.,1.,1.,.5]]]])
        out=u.mask(a,mask,'luma','multiply',False,1);self.assertTrue(torch.allclose(out[...,3],a[...,3]*.5));self.assertTrue(torch.equal(out[...,:3],a[...,:3]))
    def test_lookup_endpoints_batch_and_transparent_lut(self):
        a=torch.tensor([[[[0.,0.,0.,.4],[1.,1.,1.,.4]]]]).expand(2,-1,-1,-1)
        lut=torch.tensor([[[[1.,0.,0.,0.],[0.,0.,1.,0.]]]])
        out=u.lookup(a,lut,'luma',.5,1);self.assertTrue(torch.allclose(out[0,0,0,:3],torch.tensor([1.,0.,0.])));self.assertTrue(torch.allclose(out[1,0,1,:3],torch.tensor([0.,0.,1.])));self.assertTrue(torch.equal(out[...,3],a[...,3]))
    def test_flow_neutral_and_small_translation(self):
        y,x=torch.meshgrid(torch.arange(32),torch.arange(32),indexing='ij');g=torch.exp(-((x-16)**2+(y-16)**2)/30.)
        old=torch.cat((g[None,:,:,None].expand(1,32,32,3),torch.ones(1,32,32,1)),-1);now=old.roll(1,2)
        neutral=u.optical_flow(now,None,256,8,.00001);self.assertTrue(torch.equal(neutral[...,:2],torch.full_like(neutral[...,:2],.5)))
        flow=u.optical_flow(now,old,256,8,.00001);dx=(flow[0,12:20,12:20,0]-.5)*16;self.assertGreater(dx.mean().item(),.5);self.assertLess(dx.mean().item(),1.5)
    def test_blobs_filter_batch_and_coordinates(self):
        a=torch.zeros(2,16,16,4);a[...,3]=1;a[:,2:6,4:8,:3]=1;a[:,14,14,:3]=1
        mask,table=u.blobs(a,'luma',.5,False,256,.01,32)
        blobs=table['jsonValue']['blobs'];self.assertEqual(len(blobs),2);self.assertEqual(blobs[0]['x'],6/16);self.assertEqual(blobs[0]['area'],16/256);self.assertEqual(blobs[1]['batch'],1);self.assertEqual(mask.shape,a.shape)

if __name__=='__main__':unittest.main()
