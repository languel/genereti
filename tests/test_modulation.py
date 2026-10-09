import importlib.util
import sys
import types
import unittest
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_chop'
pkg=types.ModuleType('genereti_modulation_test');pkg.__path__=[str(root)];sys.modules[pkg.__name__]=pkg
spec=importlib.util.spec_from_file_location(pkg.__name__+'.modulation',root/'modulation.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ModulationTests(unittest.TestCase):
    def test_musical_timing_meter_and_triplets(self):
        self.assertEqual(m.quarter_notes('1m',dict(numerator=7,denominator=8)),3.5)
        self.assertEqual(m.quarter_notes('4nd'),1.5)
        self.assertAlmostEqual(m.quarter_notes('4nt'),2/3)
        phase,rate,t=m.phase_values(dict(interval='4n',performance='{"quarterNotes":2,"bpm":120}',time=.25,samples=2,sample_rate=60,speed=1),2)
        self.assertAlmostEqual(phase[0],2.5)
    def test_lfo_reproducible_and_smoothing(self):
        self.assertEqual(m.wave('sine',np.array([0]))[0],0)
        np.testing.assert_allclose(m.wave('sample & hold',np.array([2.1,2.9]),10),[m.wave('sample & hold',np.array([2.1]),10)[0]]*2)
        out=m.filtered(np.array([0.,1.,1.]),60,.1);self.assertTrue(0<out[1]<out[2]<1)
    def test_recording_validation(self):
        clip=dict(version=1,duration=2,points=[dict(t=0,x=0,y=1),dict(t=1.5,x=0,y=1),dict(t=2,x=1,y=0)])
        self.assertEqual(m.validate_gesture(clip)['points'][1]['t'],1.5)
        with self.assertRaises(ValueError):m.validate_gesture(dict(version=1,duration=1,points=[dict(t=-.5,x=0,y=0)]))
    def test_schemas_use_explicit_numeric_outputs(self):
        self.assertEqual(m.Gesture.define_schema().node_id,'GeneretiChopGesture')
        self.assertEqual(len(m.Gesture.define_schema().outputs),4)
        self.assertEqual(len(m.Lfo.define_schema().outputs),2)
