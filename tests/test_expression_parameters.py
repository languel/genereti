import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('expression_parameters',Path(__file__).resolve().parents[1]/'integrations/genereti_comfy_texture/expression_parameters.py')
params=importlib.util.module_from_spec(spec);spec.loader.exec_module(params)

class ExpressionParameters(unittest.TestCase):
    def test_metadata_controls_and_stable_slots(self):
        source='float amplitude = .5; /* 0..1 */\n// @param speed = 1 (0..4)\namplitude*speed'
        result=params.prepare_expression(source,{'values':{'amplitude':.75},'slots':{'speed':0,'amplitude':1}},{'value0':2})
        self.assertEqual(result,'(0.75)*(2.0)')
    def test_defaults_integer_rounding_and_bounds(self):
        self.assertEqual(params.prepare_expression('// @param count = 4 (int 1..8)\ncount',{'count':99}),'(8)')
        self.assertEqual(params.prepare_expression('int count = 4; /* -8..8 */\ncount',{'count':-2.5}),'(-2)')
    def test_bad_metadata_is_rejected(self):
        for source in ['// @param b = 0 (0..4)\nb','// @param speed = 1 (4..0)\nspeed','// @param speed = 1 (0..4, step:0)\nspeed','// @param speed = 1 (0..4)\n// @param speed = 2 (0..4)\nspeed']:
            with self.assertRaises(ValueError):params.prepare_expression(source)
