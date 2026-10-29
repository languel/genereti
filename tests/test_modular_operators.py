import unittest
from integrations.genereti_comfy_chop.modular import MODULAR,Sequence,Output,Mixer,Scope,Spectrum,Lissajous,Analyze,Pattern,Euclidean,Karplus,Granular,Reverb,Distortion
from integrations.genereti_comfy_chop.modular import NoteVisualizer
from integrations.genereti_comfy_chop.modulation import Curve
class ModularTests(unittest.TestCase):
 def test_schemas_are_independent_and_discoverable(self):
  for node in MODULAR:
   node.GET_SCHEMA()
   self.assertTrue(node.define_schema().display_name.startswith('ꘇ mod.'))
  self.assertEqual(Sequence.RETURN_TYPES,['GENERETI_CHOP','IMAGE'])
  self.assertEqual(Mixer.RETURN_TYPES,['GENERETI_AUDIO_BUS'])
  self.assertTrue(Output.OUTPUT_NODE)
 def test_visual_texture_dimensions_and_channel_passthrough(self):
  data={'channels':{'note':[60],'gate':[1],'velocity':[.8]}}
  result=NoteVisualizer.execute(input=data,width=128,height=64).result
  self.assertEqual(tuple(result[0].shape),(1,64,128,3))
  self.assertIs(result[1],data)
  result=Lissajous.execute(width=128,height=64).result
  self.assertEqual(tuple(result[4].shape),(1,64,128,3))
  ports={x.id for x in Lissajous.define_schema().inputs}
  self.assertTrue({'x_axis','y_axis','x_gain','y_gain','rotation','trail','line_width','width','height'}<=ports)
 def test_queue_only_describes_routes_and_silent_notes(self):
  self.assertEqual(Output.execute(input={'route':1},level=.3,mute=False).result[0]['format'],'genereti-audio-route')
  self.assertEqual(Sequence.execute(pattern='60 64').result[0]['channels']['gate'][0],0)
 def test_pattern_transforms_keep_rests_and_new_nodes_discoverable(self):
  for node in (Euclidean,Karplus,Granular,Reverb,Distortion,Pattern):node.GET_SCHEMA()
  self.assertEqual(Pattern.execute('60 - 64','reverse').result[0],'64 - 60')
  self.assertEqual(Pattern.execute('61 - 66','quantize',root=0,scale='major').result[0],'60 - 65')
 def test_curve_interpolates_saved_points(self):
  Curve.GET_SCHEMA()
  result=Curve.execute('shape',.25,'[[0,0],[0.5,1],[1,0]]').result
  self.assertAlmostEqual(result[1],.5)
 def test_analysis_queue_is_silent_and_has_matching_ports(self):
  for node in (Scope,Spectrum,Lissajous,Analyze):
   node.GET_SCHEMA()
   self.assertEqual(node.RETURN_TYPES,['GENERETI_AUDIO_BUS','GENERETI_CHOP','FLOAT','FLOAT','IMAGE'])
   result=node.execute(input={},fft_size=1024,smoothing=.5,display_gain=2).result
   self.assertEqual(result[2:4],(0.,0.))
   self.assertEqual(tuple(result[4].shape),(1,512 if node is Lissajous else 256,512,3))
   self.assertTrue(all(not channel.any() for channel in result[1]['channels'].values()))
if __name__=='__main__': unittest.main()
