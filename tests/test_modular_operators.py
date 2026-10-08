import unittest
from integrations.genereti_comfy_chop.modular import MODULAR,Sequence,Output,Mixer,Scope,Spectrum,Lissajous,Analyze
class ModularTests(unittest.TestCase):
 def test_schemas_are_independent_and_discoverable(self):
  for node in MODULAR:
   node.GET_SCHEMA()
   self.assertTrue(node.define_schema().display_name.startswith('ꘇ mod.'))
  self.assertEqual(Sequence.RETURN_TYPES,['GENERETI_CHOP'])
  self.assertEqual(Mixer.RETURN_TYPES,['GENERETI_AUDIO_BUS'])
  self.assertTrue(Output.OUTPUT_NODE)
 def test_queue_only_describes_routes_and_silent_notes(self):
  self.assertEqual(Output.execute(input={'route':1},level=.3,mute=False).result[0]['format'],'genereti-audio-route')
  self.assertEqual(Sequence.execute(pattern='60 64').result[0]['channels']['gate'][0],0)
 def test_analysis_queue_is_silent_and_has_matching_ports(self):
  for node in (Scope,Spectrum,Lissajous,Analyze):
   node.GET_SCHEMA()
   self.assertEqual(node.RETURN_TYPES,['GENERETI_AUDIO_BUS','GENERETI_CHOP','FLOAT','FLOAT','IMAGE'])
   result=node.execute(input={},fft_size=1024,smoothing=.5,display_gain=2).result
   self.assertEqual(result[2:4],(0.,0.))
   self.assertEqual(tuple(result[4].shape),(1,512 if node is Lissajous else 256,512,3))
   self.assertTrue(all(not channel.any() for channel in result[1]['channels'].values()))
if __name__=='__main__': unittest.main()
