import unittest
from integrations.genereti_comfy_chop.modular import MODULAR,Sequence,Output,Mixer
class ModularTests(unittest.TestCase):
 def test_schemas_are_independent_and_discoverable(self):
  for node in MODULAR:
   node.GET_SCHEMA()
   self.assertTrue(node.define_schema().display_name.startswith('ꘇmod.'))
  self.assertEqual(Sequence.RETURN_TYPES,['GENERETI_CHOP'])
  self.assertEqual(Mixer.RETURN_TYPES,['GENERETI_AUDIO_BUS'])
  self.assertTrue(Output.OUTPUT_NODE)
 def test_queue_only_describes_routes_and_silent_notes(self):
  self.assertEqual(Output.execute(input={'route':1},level=.3,mute=False).result[0]['format'],'genereti-audio-route')
  self.assertEqual(Sequence.execute(pattern='60 64').result[0]['channels']['gate'][0],0)
if __name__=='__main__': unittest.main()
