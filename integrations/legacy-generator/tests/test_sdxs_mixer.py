import unittest
import numpy as np
from PIL import Image,ImageDraw
from guides import GuideProcessor,prepare_sdxs_guides
from server import GenerateRequest,Runtime
from test_server_guides import FakeEngine,data_url

class MixerTests(unittest.TestCase):
    def setUp(self):
        self.image=Image.new('RGB',(64,64),'white')
        ImageDraw.Draw(self.image).rectangle((12,12,50,50),outline='black',width=2)
    def test_independent_polarity_and_zero_weight_skipping(self):
        g=prepare_sdxs_guides(GuideProcessor(),self.image,32,weights={'sketch':1,'canny':.5,'depth':0,'pose':0},inversions={})
        flipped=prepare_sdxs_guides(GuideProcessor(),self.image,32,weights={'sketch':1,'canny':.5},inversions={'canny':True})
        self.assertEqual([name for name,_,_ in g],['sketch','canny'])
        np.testing.assert_array_equal(np.asarray(g[0][1]),np.asarray(flipped[0][1]))
        np.testing.assert_array_equal(255-np.asarray(g[1][1]),np.asarray(flipped[1][1]))
    def test_pose_requires_explicit_guide_and_threshold_order_is_checked(self):
        with self.assertRaisesRegex(ValueError,'pose guide'):
            prepare_sdxs_guides(GuideProcessor(),self.image,32,weights={'pose':1},inversions={})
        with self.assertRaisesRegex(ValueError,'threshold'):
            prepare_sdxs_guides(GuideProcessor(),self.image,32,weights={'canny':1},inversions={},low=200,high=100)
        with self.assertRaisesRegex(ValueError,'at least one'):
            prepare_sdxs_guides(GuideProcessor(),self.image,32,weights={'sketch':0},inversions={})
    def test_server_keeps_sdxs_mode_and_routes_prepared_guides(self):
        runtime=Runtime();runtime.engine=FakeEngine()
        request=GenerateRequest(mode='sdxs_mixer',image=data_url(self.image),sdxs_sketch_weight=.6,sdxs_canny_weight=.4,return_guide=True)
        _,metrics=runtime.render(request)
        self.assertEqual(runtime.engine.kwargs['mode'],'sdxs_mixer')
        self.assertEqual([n for n,_,_ in runtime.engine.kwargs['sdxs_guides']],['sketch','canny'])
        self.assertEqual(metrics['conditioning']['denoiser_passes'],1)
        self.assertTrue(metrics['guide'].startswith('data:image/png;'))
        self.assertNotIn('sdxs_canny_weight',runtime.engine.kwargs)

if __name__=='__main__':unittest.main()

class ResidualRoutingTests(unittest.TestCase):
    def test_weighted_controllers_feed_one_sdxs_denoiser(self):
        from engine import Engine
        calls=[]
        class Model:
            def __init__(self,name):self.name=name
            def predict(self,inputs):
                calls.append((self.name,inputs))
                if self.name=='sdxs_sketch_control':return {'residual_0':np.ones((1,4,1,1))*float(inputs['control_scale'][0])}
                if self.name=='sdxs_residual_unet':return {'noise_pred':np.zeros((1,4,1,1))}
                return {'image':np.zeros((1,3,8,8))}
        e=Engine.__new__(Engine);e.size=8;e.models={'decoder':Model('decoder')};e.alphas=np.full(1000,.5)
        e.encode_prompt=lambda prompt,turbo=False:np.zeros((1,77,768),dtype=np.float16)
        e.noise=lambda seed:np.zeros((1,4,1,1));e.model=lambda name:Model(name)
        guide=Image.new('RGB',(8,8),'white')
        _,metrics=e.generate('ink',guide,mode='sdxs_mixer',control_scale=2,sdxs_guides=[('sketch',guide,.3),('canny',guide,.7)])
        self.assertEqual([name for name,_ in calls],['sdxs_sketch_control','sdxs_sketch_control','sdxs_residual_unet','decoder'])
        residual=calls[2][1]['residual_0']
        np.testing.assert_allclose(residual,2,atol=.002)
        self.assertEqual(metrics['model'],'SDXS DreamShaper')
