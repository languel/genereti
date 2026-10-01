"""Lightweight Core ML Real-ESRGAN frame upscaler."""
from __future__ import annotations

import hashlib
from pathlib import Path

import numpy as np
from PIL import Image


MODELS = {
    'animevideo': ('RealESRGAN_animevideo_522_fp16.mlpackage', 4),
    'general': ('RealESRGAN_general_522_fp16.mlpackage', 4),
}
INPUT_SIZE = 522
SCALE = 4
PRE_PAD = 10
TILE_SIZE = INPUT_SIZE - PRE_PAD


class CoreMLRealESRGAN:
    def __init__(self, name: str, root: Path):
        if name not in MODELS:
            raise ValueError(f'Unknown Real-ESRGAN model: {name}')
        filename, self.scale = MODELS[name]
        package = root / 'models' / 'upscalers' / filename
        if not package.exists():
            raise ValueError(f'Real-ESRGAN {name} is not installed. Run ./scripts/download_upscaler.sh.')

        import coremltools as ct

        signature = '|'.join(
            f'{path.relative_to(package)}:{path.stat().st_size}:{path.stat().st_mtime_ns}'
            for path in sorted(package.rglob('*')) if path.is_file()
        )
        key = hashlib.sha256((ct.__version__ + signature).encode()).hexdigest()[:12]
        cache = root / 'models' / 'upscalers' / 'compiled'
        cache.mkdir(parents=True, exist_ok=True)
        compiled = cache / f'{name}-{key}.mlmodelc'
        if not compiled.exists():
            ct.models.utils.compile_model(str(package), destination_path=str(compiled))

        spec = ct.utils.load_spec(str(package))
        self.input_name = spec.description.input[0].name
        self.output_name = spec.description.output[0].name
        self.model = ct.models.CompiledMLModel(str(compiled), compute_units=ct.ComputeUnit.CPU_AND_GPU)

    def upscale(self, image: Image.Image) -> Image.Image:
        rgb = np.asarray(image.convert('RGB'), dtype=np.float32) / 255.0
        height, width = rgb.shape[:2]
        if max(height, width) > TILE_SIZE:
            raise ValueError(f'Real-ESRGAN input is limited to {TILE_SIZE} × {TILE_SIZE}px per frame.')

        # The exported model accepts one fixed 522×522 tile. The source is padded
        # on the bottom/right, then that padding is cropped from the 4× result.
        padded = np.pad(rgb, ((0, PRE_PAD), (0, PRE_PAD), (0, 0)), mode='reflect')
        pad_h = INPUT_SIZE - padded.shape[0]
        pad_w = INPUT_SIZE - padded.shape[1]
        if pad_h or pad_w:
            padded = np.pad(padded, ((0, pad_h), (0, pad_w), (0, 0)), mode='reflect')
        tensor = padded.transpose(2, 0, 1)[None].astype(np.float32)
        prediction = self.model.predict({self.input_name: tensor})[self.output_name]
        pixels = prediction[0].transpose(1, 2, 0)[:height * self.scale, :width * self.scale]
        pixels = np.rint(np.clip(pixels, 0, 1) * 255).astype(np.uint8)
        return Image.fromarray(pixels, mode='RGB')
