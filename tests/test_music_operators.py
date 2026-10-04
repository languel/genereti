import sys
import unittest
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'integrations'))
from genereti_comfy_chop import music, MidiOut, OscOut, Constant
from genereti_comfy_dat import Text, ToChop, Cell, FromChop
class MusicTests(unittest.TestCase):
    def test_sequence_rest_gate(self):
        data=music.generate('Sequencer',dict(notes='60 - 67',bpm=60,division=1,gate=.5,velocity=.7,samples=6,sample_rate=2,time=0))
        np.testing.assert_equal(data['channels']['note'],[60,60,0,0,67,67]);np.testing.assert_equal(data['channels']['gate'],[1,0,0,0,1,0])
        with self.assertRaises(ValueError):music.notes('128')
    def test_arpeggiator_held_notes(self):
        data=music.generate('Arpeggiator',dict(notes='40',mode='updown',octaves=2,bpm=60,division=1,gate=.5,velocity=1,samples=6,sample_rate=1,time=0),{'channels':{'ch1.note60':np.array([1]),'ch1.note64':np.array([.5])}})
        np.testing.assert_equal(data['channels']['note'],[60,64,72,76,72,64])
    def test_schema_metadata_does_not_leak(self):
        Text.GET_SCHEMA();Constant.GET_SCHEMA()
        self.assertEqual(ToChop.RETURN_TYPES,['GENERETI_CHOP','FLOAT']);self.assertEqual(Cell.RETURN_TYPES,['STRING','FLOAT']);self.assertEqual(FromChop.CATEGORY,'ꘇ / CHOP')
        self.assertTrue(MidiOut.OUTPUT_NODE);self.assertTrue(OscOut.OUTPUT_NODE)
if __name__=='__main__':unittest.main()
