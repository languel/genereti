import importlib.util
import sys
import unittest
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def load():
    folder = ROOT / 'integrations/genereti_comfy_texture'
    spec = importlib.util.spec_from_file_location('genereti_comfy_texture_loop_test', folder / '__init__.py', submodule_search_locations=[str(folder)])
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class NoiseLoopTests(unittest.TestCase):
    def frame(self, time, **extra):
        module = load()
        args = dict(algorithm='perlin', dimensions=2, width=16, height=16, scale=4, seed=3, z=0, time=time, speed=.2, octaves=2, lacunarity=2, gain=.5, color='RGB')
        args.update(extra)
        return module.Noise.execute(**args).args[0].numpy()

    def test_loop_returns_to_the_first_frame_and_moves_in_between(self):
        first = self.frame(0, loop=4)
        np.testing.assert_allclose(self.frame(4, loop=4), first, atol=1e-5)
        np.testing.assert_allclose(self.frame(8, loop=4), first, atol=1e-5)
        self.assertGreater(np.abs(self.frame(1, loop=4) - first).mean(), .01)

    def test_rgba_makes_alpha_its_own_noise_field(self):
        rgba = self.frame(0, color='RGBA', dimensions=4)
        self.assertGreater(rgba[..., 3].std(), .02)
        self.assertTrue((self.frame(0, color='RGB')[..., 3] == 1).all())

    def test_shapes_warp_and_power_change_the_image_and_stay_in_range(self):
        base = self.frame(0, octaves=3)
        for extra in (dict(shape='ridged'), dict(shape='billow'), dict(shape='hybrid'), dict(warp=2.), dict(power=3.), dict(algorithm='cracks')):
            frame = self.frame(0, octaves=3, **extra)
            self.assertGreater(np.abs(frame - base).mean(), .01, extra)
            self.assertTrue(frame.min() >= 0 and frame.max() <= 1, extra)
        self.assertLess(self.frame(0, power=3.).mean(), self.frame(0).mean())

    def test_without_a_loop_time_just_moves(self):
        self.assertGreater(np.abs(self.frame(4) - self.frame(0)).mean(), .01)


if __name__ == '__main__':
    unittest.main()
