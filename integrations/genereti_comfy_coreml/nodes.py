from __future__ import annotations
import importlib.util
import json
import platform
import sys
import threading
from pathlib import Path
from time import perf_counter
import numpy as np
import torch
from PIL import Image
import folder_paths
from comfy_api.latest import ComfyExtension, io

ROOT = Path(__file__).resolve().parents[2]
_LOCK = threading.RLock()
_ENGINE = None
_ENGINE_KEY = None
folder_paths.add_model_folder_path('genereti_coreml', str(Path(folder_paths.models_dir) / 'genereti'))


def model_root():
    return Path(folder_paths.get_folder_paths('genereti_coreml')[0])


def sizes():
    root = model_root()
    if not root.is_dir():
        return []
    return sorted(p.name for p in root.iterdir() if p.is_dir() and p.name.isdigit()
        and all((p / f'{name}.mlpackage').exists() for name in ('unet', 'encoder', 'decoder')))


def model_paths():
    result = {}
    root = model_root()
    resolver = local_module('model_resolution')
    for size in sizes():
        installed = {p.stem for p in (root / size).glob('*.mlpackage')}
        for filename, family, style, candidates in (
            ('unet', 'sdxs', 'base', ('text', 'sketch')),
            ('anime_unet', 'sdxs', 'anime', ('text', 'sketch')),
            ('turbo_unet', 'sd_turbo', 'base', ('image', 'canny', 'depth', 'pose'))):
            if filename not in installed:
                continue
            modes = [m for m in candidates if resolver.required_models(m, style).issubset(installed)]
            result[f'{size}/{filename}.mlpackage'] = dict(size=size, family=family, style=style, modes=modes)
    return result


def local_module(name):
    # Load repository code under a private name; models remain outside Git.
    if str(ROOT) not in sys.path:
        sys.path.append(str(ROOT))
    key = '_genereti_native_' + name
    if key not in sys.modules:
        spec = importlib.util.spec_from_file_location(key, ROOT / f'{name}.py')
        module = importlib.util.module_from_spec(spec)
        sys.modules[key] = module
        try:
            spec.loader.exec_module(module)
        except Exception:
            sys.modules.pop(key, None)
            raise
    return sys.modules[key]


def tensor_image(image):
    if image is None:
        return None
    pixels = (image[0].detach().cpu().numpy().clip(0, 1) * 255).astype(np.uint8)
    picture = Image.fromarray(pixels)
    if picture.mode == 'RGBA':
        picture = Image.alpha_composite(Image.new('RGBA', picture.size, 'white'), picture)
    return picture.convert('RGB')


def get_engine(root, size):
    global _ENGINE, _ENGINE_KEY
    key = (str(Path(root).resolve()), int(size))
    with _LOCK:
        if _ENGINE_KEY != key:
            engine = local_module('engine').Engine(int(size), model_root=root, threads=None)
            _ENGINE = engine
            _ENGINE_KEY = key
        return _ENGINE


def generate(model_path, prompt, mode, seed=42, control_scale=1., invert=False,
             movement=0., image=None, preprocess=False, strength=.65, noise_phase=0., family=None):
    if platform.system() != 'Darwin' or platform.machine() != 'arm64':
        raise RuntimeError('Native Genereti requires macOS 14+ on Apple silicon.')
    if int(platform.mac_ver()[0].split('.')[0]) < 14:
        raise RuntimeError('Native Genereti requires macOS 14 or later.')
    profile = model_paths().get(model_path)
    if not profile or (family and profile['family'] != family):
        raise ValueError('Choose an installed model package for this generator family.')
    if mode not in profile['modes']:
        raise ValueError(f"{model_path} supports: {', '.join(profile['modes'])}. Select a supported mode.")
    start = perf_counter()
    with _LOCK:
        engine = get_engine(model_root(), int(profile['size']))
        picture = None if mode == 'text' else tensor_image(image)
        if mode != 'text' and picture is None:
            raise ValueError('This mode requires an IMAGE input.')
        if preprocess and mode in ('canny', 'depth'):
            if not hasattr(engine, '_genereti_guides'):
                engine._genereti_guides = local_module('guides').GuideProcessor()
            picture = engine._genereti_guides.process(picture, mode, engine.size)
        if picture is not None and invert:
            from PIL import ImageOps
            picture = ImageOps.invert(picture)
        output, metrics = engine.generate(prompt, image=picture, mode=mode, style=profile['style'],
            seed=seed, strength=strength, control_scale=control_scale, noise_phase=noise_phase)
        result = torch.from_numpy(np.asarray(output.convert('RGB'), dtype=np.float32).copy() / 255)[None]
        return io.NodeOutput(result, json.dumps({**metrics, 'backend':'Core ML in Comfy',
            'size':engine.size, 'model_path':model_path, 'family':profile['family'],
            'node_ms':round((perf_counter()-start)*1000,2)}))


class FamilyGenerator(io.ComfyNode):
    family = None
    @classmethod
    def define_schema(cls):
        paths=[path for path, profile in model_paths().items() if profile['family']==cls.family]
        turbo=cls.family=='sd_turbo'
        inputs=[io.Combo.Input('model_path',options=paths or ['not installed'],default=(paths or ['not installed'])[0],
            tooltip='Denoiser package under models/genereti. Path determines native resolution and model variant; companions live beside it.'),
            io.String.Input('prompt',default='A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition',multiline=True),
            io.Combo.Input('mode',options=['image','canny','depth','pose'] if turbo else ['text','sketch'],default='image' if turbo else 'sketch',tooltip='Available modes follow the selected package and installed companion controls.'),
            io.Int.Input('seed',default=42,min=0,max=4294967295)]
        if turbo:
            inputs.extend([io.Boolean.Input('preprocess',default=True,tooltip='Extract Canny edges or depth. Off accepts a prepared guide; image and pose pass through.'),
                io.Float.Input('strength',default=.65,min=.05,max=1.,step=.01,tooltip='Image remix noise strength; guide modes use a fixed one-step schedule.')])
        inputs.extend([io.Float.Input('control_scale',display_name='influence',default=1.,min=0.,max=65504.,step=.05,tooltip='Guide influence; used by sketch/Canny/depth/pose.'),
            io.Boolean.Input('invert',default=False,tooltip='Invert the input guide after preparation, before inference.'),
            io.Float.Input('movement',default=0.,min=0.,max=100.,step=.01,tooltip='Live seed-noise rotation speed. Zero holds noise fixed. Queue renders one phase.'),
            io.Image.Input('image',optional=True)])
        return io.Schema(node_id=cls.__name__,display_name='ꘇ SD Turbo generator' if turbo else 'ꘇ SDXS generator',
            category='Genereti / Native Core ML',not_idempotent=True,
            description='Native Core ML on macOS 14+ Apple silicon. Live through Comfy or Comfy Queue. Connect IMAGE to live image preview. No external generator server.',
            inputs=inputs,outputs=[io.Image.Output(display_name='image'),io.String.Output(display_name='metrics')])

    @classmethod
    def execute(cls, **kwargs):
        return generate(**kwargs,family=cls.family)


class GeneretiSDXSGenerate(FamilyGenerator):
    family='sdxs'


class GeneretiSDTurboGenerate(FamilyGenerator):
    family='sd_turbo'


class GeneretiNativeExtension(ComfyExtension):
    async def get_node_list(self):
        return [GeneretiSDXSGenerate,GeneretiSDTurboGenerate]
