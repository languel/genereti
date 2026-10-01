"""Small, real-time image treatments applied after Core ML inference."""
from __future__ import annotations

from collections.abc import Callable
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def composite_layers(sdxs: Image.Image, canny: Image.Image, *, mode='normal', mix=.5) -> Image.Image:
    """Blend two generated layers; mix=0 keeps SDXS, mix=1 keeps Canny/Turbo."""
    from PIL import ImageChops

    base = sdxs.convert('RGB')
    layer = canny.convert('RGB').resize(base.size, Image.Resampling.LANCZOS)
    if mode == 'screen':
        combined = ImageChops.screen(base, layer)
    elif mode == 'multiply':
        combined = ImageChops.multiply(base, layer)
    elif mode == 'difference':
        combined = ImageChops.difference(base, layer)
    else:
        combined = layer
    return Image.blend(base, combined, float(np.clip(mix, 0, 1)))


def transfer_palette(image: Image.Image, reference: Image.Image, strength: float) -> Image.Image:
    """Transfer the reference's Lab chroma distribution while preserving luminance."""
    if strength <= 0:
        return image
    import cv2

    current = np.asarray(image.convert('RGB'), dtype=np.uint8)
    ref = np.asarray(reference.convert('RGB').resize(image.size, Image.Resampling.LANCZOS), dtype=np.uint8)
    lab = cv2.cvtColor(current, cv2.COLOR_RGB2LAB).astype(np.float32)
    ref_lab = cv2.cvtColor(ref, cv2.COLOR_RGB2LAB).astype(np.float32)
    original = lab.copy()
    alpha = float(np.clip(strength, 0, 1))
    for channel in (1, 2):
        out_values = lab[..., channel]
        ref_values = ref_lab[..., channel]
        out_mean, out_std = float(out_values.mean()), float(out_values.std())
        ref_mean, ref_std = float(ref_values.mean()), float(ref_values.std())
        matched = (out_values - out_mean) * (ref_std / max(out_std, 1.0)) + ref_mean
        lab[..., channel] = original[..., channel] * (1 - alpha) + matched * alpha
    pixels = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB)
    return Image.fromarray(pixels)


def apply_postprocessing(
    image: Image.Image,
    *,
    reference: Image.Image | None = None,
    palette_strength: float = 0,
    black_point: int = 0,
    white_point: int = 255,
    gamma: float = 1,
    brightness: float = 1,
    contrast: float = 1,
    saturation: float = 1,
    sharpen: float = 0,
    emboss: float = 0,
    learned_upscale: Callable[[Image.Image], Image.Image] | None = None,
    upscale_iterations: int = 1,
    upscale_feedback: float = .75,
    upscale_output: str = '4x',
    upscale: int = 1,
    upscale_filter: str = 'lanczos',
) -> Image.Image:
    """Apply emboss, color/tone, recursive learned upscaling, and final scaling."""
    result = image.convert('RGB')
    source_size = result.size

    # Emboss changes the source relief before palette and tonal work, so it can
    # become part of the color treatment and of every learned-upscale pass.
    emboss = float(np.clip(emboss, 0, 1))
    if emboss:
        result = Image.blend(result, result.filter(ImageFilter.EMBOSS).convert('RGB'), emboss)

    if reference is not None and palette_strength > 0:
        result = transfer_palette(result, reference, palette_strength)

    black = int(np.clip(black_point, 0, 254))
    white = int(np.clip(white_point, black + 1, 255))
    gamma = float(np.clip(gamma, .1, 5))
    if black != 0 or white != 255 or abs(gamma - 1) > 1e-6:
        values = np.arange(256, dtype=np.float32)
        values = np.clip((values - black) / (white - black), 0, 1)
        lut = np.rint(np.power(values, 1 / gamma) * 255).astype(np.uint8)
        result = result.point(list(lut) * 3)

    brightness = float(np.clip(brightness, 0, 4))
    contrast = float(np.clip(contrast, 0, 4))
    saturation = float(np.clip(saturation, 0, 4))
    if brightness != 1:
        result = ImageEnhance.Brightness(result).enhance(brightness)
    if contrast != 1:
        result = ImageEnhance.Contrast(result).enhance(contrast)
    if saturation != 1:
        result = ImageEnhance.Color(result).enhance(saturation)

    if learned_upscale is not None:
        base = result.copy()
        feedback_input = base
        iterations = int(np.clip(upscale_iterations, 1, 4))
        feedback = float(np.clip(upscale_feedback, 0, 1))
        for index in range(iterations):
            enlarged = learned_upscale(feedback_input).convert('RGB')
            if index + 1 < iterations:
                lowpass = enlarged.resize(source_size, Image.Resampling.LANCZOS)
                feedback_input = Image.blend(base, lowpass, feedback)
            else:
                result = enlarged

        output_sizes = {
            '4x': (source_size[0] * 4, source_size[1] * 4),
            '2x': (source_size[0] * 2, source_size[1] * 2),
            'source': source_size,
        }
        target_size = output_sizes.get(upscale_output, output_sizes['4x'])
        if result.size != target_size:
            result = result.resize(target_size, Image.Resampling.LANCZOS)

    sharpen = float(np.clip(sharpen, 0, 4))
    if sharpen:
        result = result.filter(ImageFilter.UnsharpMask(radius=1.25, percent=round(sharpen * 100), threshold=2))

    scales = {1: Image.Resampling.LANCZOS, 2: Image.Resampling.LANCZOS, 4: Image.Resampling.LANCZOS}
    filters = {
        'nearest': Image.Resampling.NEAREST,
        'bilinear': Image.Resampling.BILINEAR,
        'bicubic': Image.Resampling.BICUBIC,
        'lanczos': Image.Resampling.LANCZOS,
    }
    scale = int(upscale) if int(upscale) in scales else 1
    if scale > 1:
        result = result.resize((result.width * scale, result.height * scale), filters.get(upscale_filter, scales[scale]))
    return result
