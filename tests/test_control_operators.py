import importlib.util
from pathlib import Path
import struct
import unittest
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'integrations'
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
signals=load('signals','genereti_comfy_chop/signals.py');tables=load('tables','genereti_comfy_dat/tables.py');expr=load('expr','genereti_comfy_texture/expression.py');osc=load('osc','genereti_comfy_chop/osc.py')
class ControlOperators(unittest.TestCase):
    def test_expression_safety_and_precedence(self):
        self.assertEqual(expr.evaluate('-2^2+clamp(v,0,1)*3',dict(v=2)),-1)
        for source in ['__import__("os")','v.__class__','[1]','lambda:1']:
            with self.assertRaises(ValueError):expr.evaluate(source,dict(v=0))
    def test_sample_time_and_processing(self):
        data=signals.generate('Expression',dict(samples=4,sample_rate=4,channels=2,time=0,expression='sin(t*tau)+c'))
        np.testing.assert_allclose(data['channels']['chan0'],[0,1,0,-1],atol=1e-6)
        result=signals.process('Math',data,dict(operation='fit',low=0,high=1))
        np.testing.assert_allclose(result['channels']['chan0'],[.5,1,.5,0],atol=1e-6)
        np.testing.assert_allclose(data['channels']['chan1'],[1,2,1,0],atol=1e-6)
    def test_merge_resamples_and_speed_units(self):
        a=signals.signal({'a':[0,0,0]},60);b=signals.signal({'a':[0,1]},30)
        np.testing.assert_allclose(signals.process('Merge',a,{},b)['channels']['a_'],[0,.5,1])
        np.testing.assert_allclose(signals.process('Speed',signals.signal({'a':[1,1]},2),{})['channels']['a'],[.5,1])
    def test_csv_json_and_tables(self):
        data=tables.parse('name,value\n"a,b","x""y"\n"two\nlines",0\n');self.assertEqual(tables.parse(tables.text(data)),data)
        self.assertEqual(tables.from_json('[{"n":1,"x":true},{"n":2,"x":{"a":1}}]')['rows'],[['n','x'],['1','true'],['2','{"a":1}']])
        trans=tables.process('Transpose',data,{});self.assertEqual(trans['rows'][0],['name','a,b','two\nlines'])
        with self.assertRaises(Exception):tables.parse('"unfinished')
    def test_dat_to_chop_names_and_nonfinite(self):
        data=tables.to_chop(tables.table([['x','x'],[1,2],['NaN',3]]));self.assertEqual(list(data['channels']),['x','x_']);np.testing.assert_equal(data['channels']['x'],[1,0])
    def test_osc_message_bundle_and_malformed(self):
        packet=osc.encode('/test',[.25,1,-2]);self.assertEqual(osc.decode(packet),[('/test',[.25,1.,-2.])])
        bundle=b'#bundle\0'+b'\0'*8+struct.pack('>I',len(packet))+packet;self.assertEqual(osc.decode(bundle),osc.decode(packet))
        for packet in [b'',b'#bundle\0'+b'\0'*8+struct.pack('>I',99),osc._string('/test')+osc._string(',s')+osc._string('hi')]:
            with self.assertRaises((ValueError,struct.error)):osc.decode(packet)
if __name__=='__main__':unittest.main()
