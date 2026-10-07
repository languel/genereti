import unittest
import json
import numpy as np
from integrations.genereti_comfy_performance import Time,Timeline,Scale,Quantize,Monitor
from integrations.genereti_comfy_chop.modular import Transport
from integrations.genereti_comfy_texture import Expression,Noise
from integrations.genereti_comfy_texture.expression import evaluate
class PerformanceTests(unittest.TestCase):
 def test_ports_keep_transport_clock_at_zero(self):
  for node in (Time,Timeline,Scale,Quantize,Monitor,Transport):node.GET_SCHEMA()
  self.assertEqual(Transport.RETURN_TYPES[0],'GENERETI_AUDIO_CLOCK')
  self.assertEqual(len(Transport.execute().result),5)
  out=Transport.execute(performance=json.dumps(dict(seconds=2,quarterNotes=4,bpm=120))).result
  self.assertEqual(out[1]['sample_rate'],25)
  self.assertEqual(out[1]['start'],2)
  self.assertEqual(float(out[1]['channels']['ticks'][0]),1920)
 def test_monitor_queue_uses_measured_report_without_claiming_queue_fps(self):
  out=Monitor.execute(report=json.dumps(dict(fps=59.8,p95Ms=17.2,slowFrames=2))).result
  self.assertEqual(out[0],59.8);self.assertAlmostEqual(float(out[1]['channels']['p95Ms'][0]),17.2,places=4)
  self.assertEqual(Monitor.execute().result[0],0)
 def test_queue_uses_frozen_clock_in_six_eight(self):
  snap=json.dumps(dict(seconds=2,quarterNotes=4,bpm=120,signature=dict(numerator=6,denominator=8)))
  out=Time.execute(unit='beat',performance=snap).result
  self.assertEqual(out[0],8);self.assertEqual(out[3]['bar'],1);self.assertEqual(out[3]['ticks'],1920)
 def test_pitch_quantizer_preserves_gates(self):
  data=dict(channels=dict(note=np.array([61,64]),gate=np.array([1,0])),sample_rate=60,start=0)
  result=Quantize.execute(data,music=Scale.execute(scale='major').result[0]).result[0]
  np.testing.assert_equal(result['channels']['note'],[60,64]);np.testing.assert_equal(result['channels']['gate'],[1,0])
 def test_expression_globals_and_offsets_queue(self):
  snap=json.dumps(dict(seconds=2,quarterNotes=4,bpm=120,music=dict(root=2)))
  output=Expression.execute(expression='__.time/10+x+z',width=2,height=1,time=0,offset_x=.1,offset_z=.1,performance=snap).result[0]
  self.assertAlmostEqual(float(output[0,0,0,0]),.65,places=5)
  with self.assertRaises(ValueError):evaluate('__.constructor',{})
 def test_noise_domain_offsets_are_effective(self):
  kwargs=dict(algorithm='perlin',dimensions=4,width=8,height=8,scale=3,seed=2,z=.4,time=1,speed=.2,octaves=1,lacunarity=2,gain=.5,color='RGB')
  a=Noise.execute(**kwargs).result[0];b=Noise.execute(**kwargs,offset_x=.3,offset_y=.2,offset_z=.1,offset_t=2).result[0]
  self.assertGreater(float((a-b).abs().max()),.01)
if __name__=='__main__':unittest.main()
