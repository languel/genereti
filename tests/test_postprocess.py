import unittest

import numpy as np
from PIL import Image

from postprocess import apply_postprocessing, composite_layers, transfer_palette


class PostprocessingTests(unittest.TestCase):
    def setUp(self):
        self.red = Image.new('RGB', (8, 8), (255, 0, 0))
        self.blue = Image.new('RGB', (8, 8), (0, 0, 255))

    def test_composite_mix_endpoints_select_each_branch(self):
        self.assertEqual(composite_layers(self.red, self.blue, mix=0).getpixel((0, 0)), (255, 0, 0))
        self.assertEqual(composite_layers(self.red, self.blue, mix=1).getpixel((0, 0)), (0, 0, 255))

    def test_levels_and_resampling_have_expected_bounds_and_dimensions(self):
        ramp = Image.fromarray(np.tile(np.arange(256, dtype=np.uint8), (8, 1)), mode='L').convert('RGB')
        result = apply_postprocessing(ramp, black_point=32, white_point=224, sharpen=0, upscale=2, upscale_filter='nearest')
        values = np.asarray(result)
        self.assertEqual(result.size, (512, 16))
        self.assertTrue(np.all(values[:, :64] == 0))
        self.assertTrue(np.all(values[:, -64:] == 255))

    def test_default_finish_can_be_disabled_for_identity(self):
        result = apply_postprocessing(self.red, sharpen=0)
        np.testing.assert_array_equal(np.asarray(result), np.asarray(self.red))

    def test_palette_transfer_changes_chroma_without_replacing_image(self):
        source = Image.new('RGB', (16, 16), (125, 125, 125))
        reference = Image.new('RGB', (16, 16), (205, 70, 130))
        result = transfer_palette(source, reference, 1)
        self.assertEqual(result.size, source.size)
        self.assertNotEqual(result.getpixel((8, 8)), source.getpixel((8, 8)))


if __name__ == '__main__':
    unittest.main()
