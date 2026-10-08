import unittest

import numpy as np
from PIL import Image, ImageFilter

from postprocess import apply_postprocessing, composite_layers, transfer_palette


class PostprocessingTests(unittest.TestCase):
    def setUp(self):
        self.red = Image.new('RGB', (8, 8), (255, 0, 0))
        self.blue = Image.new('RGB', (8, 8), (0, 0, 255))

    def test_neutral_input_does_not_desaturate_generated_color(self):
        from postprocess import follow_input_colors
        source=Image.new('RGB',(32,32),'white')
        source.paste((0,0,0),(0,0,5,32))
        original=Image.new('RGB',(32,32),(60,120,210))
        result=follow_input_colors(original,source,1,16)
        np.testing.assert_array_equal(np.asarray(result),np.asarray(original))

    def test_value_guide_changes_broad_values_and_keeps_texture(self):
        from postprocess import follow_input_values
        import cv2
        checker=np.indices((32,32)).sum(axis=0)%2
        generated=Image.fromarray((120+checker*12).astype(np.uint8)).convert('RGB')
        source=Image.new('RGB',(32,32),(80,80,80));source.paste((180,180,180),(16,0,32,32))
        result=follow_input_values(generated,source,.8,16)
        values=cv2.cvtColor(np.asarray(result),cv2.COLOR_RGB2LAB)[...,0].astype(float)
        self.assertGreater(values[:,24:].mean()-values[:,:8].mean(),50)
        self.assertGreater(abs(values[16,3]-values[16,4]),5)

    def test_source_colors_follow_positions_and_retain_generated_shading(self):
        import cv2
        source=np.zeros((32,32,3),dtype=np.uint8)
        source[:,:16]=(90,130,180);source[:,16:]=(190,155,80)
        ramp=np.tile(np.linspace(100,175,32,dtype=np.uint8)[:,None],(1,32))
        generated=Image.fromarray(ramp).convert('RGB')
        output=apply_postprocessing(generated,color_source=Image.fromarray(source),source_color_strength=1,source_color_spread=0)
        pixels=np.asarray(output)
        self.assertGreater(int(pixels[16,5,2]),int(pixels[16,5,0]))
        self.assertGreater(int(pixels[16,26,0]),int(pixels[16,26,2]))
        luminance=cv2.cvtColor(pixels,cv2.COLOR_RGB2LAB)[...,0].astype(float)
        original=cv2.cvtColor(np.asarray(generated),cv2.COLOR_RGB2LAB)[...,0].astype(float)
        self.assertLess(float(np.abs(luminance-original).mean()),3)
        self.assertGreater(float(luminance[-1].mean()-luminance[0].mean()),50)
        untouched=apply_postprocessing(generated,color_source=Image.fromarray(source),source_color_strength=0)
        np.testing.assert_array_equal(np.asarray(untouched),np.asarray(generated))

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

    def test_recursive_upscale_downsamples_between_passes_and_keeps_source_size(self):
        source = Image.fromarray(np.tile(np.arange(8, dtype=np.uint8) * 30, (8, 1)), mode='L').convert('RGB')
        inputs = []

        def fake_upscaler(image):
            inputs.append(image.copy())
            return image.resize((image.width * 4, image.height * 4), Image.Resampling.BICUBIC)

        first_high = fake_upscaler(source)
        expected_second_input = Image.blend(
            source,
            first_high.resize(source.size, Image.Resampling.LANCZOS),
            .6,
        )
        inputs.clear()

        result = apply_postprocessing(
            source,
            learned_upscale=fake_upscaler,
            upscale_iterations=3,
            upscale_feedback=.6,
            upscale_output='source',
            sharpen=0,
        )

        self.assertEqual(len(inputs), 3)
        self.assertEqual(inputs[0].size, source.size)
        np.testing.assert_array_equal(np.asarray(inputs[1]), np.asarray(expected_second_input))
        self.assertEqual(inputs[2].size, source.size)
        self.assertEqual(result.size, source.size)

    def test_recursive_upscale_can_return_two_times_source_size(self):
        source = Image.new('RGB', (8, 6), (80, 120, 160))
        result = apply_postprocessing(
            source,
            learned_upscale=lambda image: image.resize((image.width * 4, image.height * 4)),
            upscale_iterations=2,
            upscale_output='2x',
            sharpen=0,
        )
        self.assertEqual(result.size, (16, 12))

    def test_brightness_contrast_and_saturation_are_independent_controls(self):
        color = Image.new('RGB', (8, 8), (80, 20, 10))
        gray = apply_postprocessing(color, saturation=0, sharpen=0)
        bright = apply_postprocessing(color, brightness=2, sharpen=0)
        self.assertEqual(np.unique(np.asarray(gray).reshape(-1, 3), axis=0).shape[0], 1)
        self.assertGreater(bright.getpixel((0, 0))[0], color.getpixel((0, 0))[0])

    def test_emboss_is_applied_before_learned_upscaler(self):
        source = Image.fromarray(np.arange(64, dtype=np.uint8).reshape(8, 8), mode='L').convert('RGB')
        seen = []
        expected = Image.blend(source, source.filter(ImageFilter.EMBOSS).convert('RGB'), .4)

        apply_postprocessing(
            source,
            emboss=.4,
            learned_upscale=lambda image: seen.append(image.copy()) or image.resize((32, 32)),
            upscale_output='source',
            sharpen=0,
        )

        np.testing.assert_array_equal(np.asarray(seen[0]), np.asarray(expected))


if __name__ == '__main__':
    unittest.main()
