import base64
import io
import unittest

import numpy as np
from PIL import Image

from server import GenerateRequest, Runtime


def data_url(image):
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')


class FakeEngine:
    def __init__(self):
        self.size = 2
        self.image = None
        self.kwargs = None

    def generate(self, prompt, image=None, **kwargs):
        self.image = image.copy()
        self.kwargs = kwargs
        return Image.new('RGB', (2, 2), (100, 120, 140)), {'model': 'test', 'inference_ms': 1}


class FakeGuides:
    def process(self, image, mode, size):
        return Image.new('RGB', image.size, (0, 40, 255))


class ServerGuideInversionTests(unittest.TestCase):
    def setUp(self):
        self.runtime = Runtime()
        self.runtime.engine = FakeEngine()
        self.runtime.guides = FakeGuides()
        self.runtime.size = 2
        self.source = Image.fromarray(np.array([
            [[0, 20, 255], [10, 30, 200]],
            [[40, 60, 150], [70, 80, 100]],
        ], dtype=np.uint8), mode='RGB')

    def render(self, mode, **values):
        request = GenerateRequest(mode=mode, image=data_url(self.source), preprocess=False, **values)
        self.runtime.render(request)
        return self.runtime.engine

    def test_resolution_is_consumed_by_runtime_not_forwarded_to_engine(self):
        for resolution in ('auto', 256, 384, 512):
            with self.subTest(resolution=resolution):
                engine = self.render('sketch', resolution=resolution)
                self.assertNotIn('resolution', engine.kwargs)

    def test_each_standalone_guide_uses_its_own_inversion_setting(self):
        settings = {
            'sketch': 'invert_sketch_guide',
            'canny': 'invert_canny_guide',
            'depth': 'invert_depth_guide',
            'pose': 'invert_pose_guide',
        }
        for mode, selected in settings.items():
            with self.subTest(mode=mode):
                engine = self.render(mode, **{selected: True})
                np.testing.assert_array_equal(np.asarray(engine.image), 255 - np.asarray(self.source))
                self.assertFalse(any(key.startswith('invert_') for key in engine.kwargs))

    def test_composite_sketch_and_canny_guides_invert_independently(self):
        engine = self.render('composite', invert_sketch_guide=True)
        np.testing.assert_array_equal(np.asarray(engine.image), 255 - np.asarray(self.source))
        np.testing.assert_array_equal(np.asarray(engine.kwargs['control_image']), np.full((2, 2, 3), (0, 40, 255), dtype=np.uint8))

        engine = self.render('composite', invert_canny_guide=True)
        np.testing.assert_array_equal(np.asarray(engine.image), np.asarray(self.source))
        np.testing.assert_array_equal(np.asarray(engine.kwargs['control_image']), np.full((2, 2, 3), (255, 215, 0), dtype=np.uint8))


if __name__ == '__main__':
    unittest.main()
