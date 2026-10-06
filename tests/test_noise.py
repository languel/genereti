import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('noise',ROOT/'integrations/genereti_comfy_texture/noise.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class NoiseTests(unittest.TestCase):
    def test_vectorized_queue_matches_scalar_browser_in_all_dimensions(self):
        script="""import {noise} from './integrations/genereti_comfy_texture/web/noise.js';
        const cases=[];for(const kind of ['perlin','simplex','value'])for(let n=1;n<=4;n++){
        const points=Array.from({length:64},(_,i)=>Array.from({length:n},(_,j)=>i*.19+j*.37-2.1));
        cases.push({kind,points,values:points.map(p=>noise(kind,...p))});}console.log(JSON.stringify(cases));"""
        cases=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT))
        for case in cases:
            p=np.asarray(case['points']);actual=module.noise(case['kind'],*p.T)
            np.testing.assert_allclose(actual,case['values'],atol=1e-12)
    def test_invalid_dimensions(self):
        with self.assertRaises(ValueError):module.noise('perlin')
        with self.assertRaises(ValueError):module.noise('simplex',1,2,3,4,5)

if __name__=='__main__':unittest.main()
