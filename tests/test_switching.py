import importlib.util
import sys
import unittest
from pathlib import Path
import numpy as np
import torch
ROOT=Path(__file__).resolve().parents[1]/'integrations'
def load(name,pack):
    spec=importlib.util.spec_from_file_location(name,ROOT/pack/'__init__.py',submodule_search_locations=[str(ROOT/pack)])
    mod=importlib.util.module_from_spec(spec);sys.modules[name]=mod;spec.loader.exec_module(mod);return mod
chop=load('switch_chop','genereti_comfy_chop');top=load('switch_top','genereti_comfy_texture');dat=load('switch_dat','genereti_comfy_dat')
class Switching(unittest.TestCase):
    def test_schemas(self):
        for pack in [chop,top,dat]:
            schema=pack.Switch.define_schema();self.assertEqual(schema.inputs[0].template.max,64);self.assertEqual(schema.inputs[0].template.prefix,'source')
    def test_chop(self):
        a=chop.signals.signal({'x':[0,0,0]},60,4);b=chop.signals.signal({'x':[0,8]},30,4)
        np.testing.assert_equal(chop.Switch.execute(mode='float',index=.25,sources={'source2':b,'source0':a}).result[0]['channels']['x'],[0,1,2])
        np.testing.assert_equal(chop.signals.switch_blend(chop.signals.signal({'x':[0]}),b,.5)['channels']['x'],[0])
        self.assertIs(chop.Switch.execute(mode='int',index=100,sources={'source0':a,'source2':b}).result[0],b)
        with self.assertRaises(ValueError):chop.Switch.execute(mode='int',index=0)
    def test_top_alpha_resize(self):
        a=torch.tensor([[[[1.,0.,0.,1.]]]]);b=torch.zeros(1,2,2,4);b[...,2]=1
        mixed=top.Switch.execute(mode='float',index=.5,sources={'source0':a,'source1':b}).result[0]
        torch.testing.assert_close(mixed,torch.tensor([[[[1.,0.,0.,.5]]]]))
        self.assertIs(top.Switch.execute(mode='int',index=1,sources={'source0':a,'source1':b}).result[0],b)
    def test_dat_dictionary_and_tables(self):
        a=dat.tables.from_json('{"x":0,"nested":{"v":[0,2],"label":"a","enabled":false},"onlyA":1}')
        b=dat.tables.from_json('{"x":8,"nested":{"v":[8,6],"label":"b","enabled":true},"onlyB":9}')
        result=dat.Switch.execute(mode='float',index=.25,sources={'source0':a,'source1':b}).result[0]
        self.assertEqual(result['jsonValue'],{'x':2,'nested':{'v':[2,3],'label':'a','enabled':False},'onlyA':1})
        result=dat.Switch.execute(mode='float',index=.5,sources={'source0':dat.tables.table([['name','value'],['x',0]]),'source1':dat.tables.table([['name','value'],['x',8]])}).result[0]
        self.assertEqual(result['rows'],[['name','value'],['x','4.0']])
if __name__=='__main__':unittest.main()
