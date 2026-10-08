import unittest

import numpy as np
from PIL import Image

from guides import invert_guide


class GuideTests(unittest.TestCase):
    def test_guide_inversion_swaps_light_and_dark_per_channel(self):
        source = Image.fromarray(np.array([[[0, 48, 255], [255, 128, 0]]], dtype=np.uint8), mode='RGB')
        result = np.asarray(invert_guide(source))
        np.testing.assert_array_equal(result, np.array([[[255, 207, 0], [0, 127, 255]]], dtype=np.uint8))

    def test_guide_inversion_is_an_involution(self):
        source = Image.fromarray(np.arange(3 * 7 * 5, dtype=np.uint8).reshape(5, 7, 3), mode='RGB')
        np.testing.assert_array_equal(np.asarray(invert_guide(invert_guide(source))), np.asarray(source))


if __name__ == '__main__':
    unittest.main()
