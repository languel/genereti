"""Single-step SDXS inference on Core ML. No camera capture or network inference."""
from __future__ import annotations
import os
os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
from pathlib import Path
import hashlib
from collections import OrderedDict
from time import perf_counter
import numpy as np
from PIL import Image, ImageOps
from postprocess import composite_layers
import coremltools as ct
import torch
from transformers import CLIPTextModel, CLIPTokenizer
from huggingface_hub import snapshot_download

ROOT = Path(__file__).resolve().parent
MODEL = 'IDKiro/sdxs-512-dreamshaper'
REVISION = '76f720262bb051da75666b22c902a78c8e16c763'

class Engine:
    def __init__(self, size=512, control=True):
        self.size = size
        self.directory = ROOT / "models" / str(size)
        self.turbo_tokenizer = None
        self.turbo_text_encoder = None
        directory = ROOT / 'models' / str(size)
        self.models = {}
        for name in ['unet', 'encoder', 'decoder'] + (['controlled_unet'] if control else []):
            path = directory / (name + '.mlpackage')
            if not path.exists():
                if name == 'controlled_unet': continue
                raise FileNotFoundError(f'{path} missing. Run ./scripts/download_models.sh first.')
            print(f'Loading Core ML {name}', flush=True)
            self.models[name] = self.load_compiled(path)
        path = snapshot_download(MODEL, revision=REVISION, local_files_only=True)
        self.tokenizer = CLIPTokenizer.from_pretrained(path, subfolder='tokenizer', local_files_only=True)
        torch.set_num_threads(4)
        self.text_encoder = CLIPTextModel.from_pretrained(path, subfolder='text_encoder', local_files_only=True).eval()
        self.embeddings = OrderedDict()
        self.noises = OrderedDict()
        betas = np.linspace(np.sqrt(.00085), np.sqrt(.012), 1000, dtype=np.float32)**2
        self.alphas = np.cumprod(1-betas)
        self.previous = None
        self.previous_key = None

    def load_compiled(self, path):
        # Reuse compiled assets across restarts instead of duplicating multi-GB
        # compiler output in the system temporary folder on every launch.
        signature='|'.join(f'{p.relative_to(path)}:{p.stat().st_size}:{p.stat().st_mtime_ns}'
            for p in sorted(path.rglob('*')) if p.is_file())
        key=hashlib.sha256((ct.__version__+signature).encode()).hexdigest()[:12]
        cache=self.directory/'compiled';cache.mkdir(exist_ok=True)
        dest=cache/f'{path.stem}-{key}.mlmodelc'
        if not dest.exists():
            print('Compiling cache',path.stem,flush=True)
            ct.models.utils.compile_model(str(path),destination_path=str(dest))
        return ct.models.CompiledMLModel(str(dest),compute_units=ct.ComputeUnit.CPU_AND_GPU)

    def model(self, name):
        if name not in self.models:
            path = self.directory / (name + '.mlpackage')
            if not path.exists(): raise ValueError(f'{name} is not installed at {self.size} px.')
            print('Loading Core ML',name,flush=True)
            self.models[name] = self.load_compiled(path)
        return self.models[name]

    def encode_prompt(self, prompt, turbo=False):
        if turbo and self.turbo_tokenizer is None:
            path=snapshot_download('stabilityai/sd-turbo', revision='b261bac6fd2cf515557d5d0707481eafa0485ec2',local_files_only=True)
            self.turbo_tokenizer=CLIPTokenizer.from_pretrained(path,subfolder='tokenizer',local_files_only=True)
            self.turbo_text_encoder=CLIPTextModel.from_pretrained(path,subfolder='text_encoder',variant='fp16',local_files_only=True).float().eval()
        key=('turbo' if turbo else 'sdxs',prompt)
        tokenizer=self.turbo_tokenizer if turbo else self.tokenizer
        encoder=self.turbo_text_encoder if turbo else self.text_encoder
        if key not in self.embeddings:
            tokens = tokenizer(prompt, padding='max_length', max_length=77,
                truncation=True, return_tensors='pt')
            with torch.inference_mode():
                embedding = encoder(tokens.input_ids)[0].numpy().astype(np.float16)
            self.embeddings[key] = embedding
            if len(self.embeddings) > 24: self.embeddings.popitem(last=False)
        self.embeddings.move_to_end(key)
        return self.embeddings[key]

    def noise(self, seed):
        if seed not in self.noises:
            self.noises[seed] = np.random.RandomState(seed).randn(1,4,self.size//8,self.size//8).astype(np.float32)
            if len(self.noises) > 8: self.noises.popitem(last=False)
        return self.noises[seed]

    def generate(self, prompt, image=None, *, mode='text', seed=42, strength=.65,
                 control_scale=.8, canny_control_scale=None, composite_mix=.5,
                 composite_mode='normal', control_image=None, feedback=0., noise_phase=0.,
                 prompt_b='', prompt_mix=0., style='base'):
        if mode == 'composite':
            required = ('controlled_unet', 'control_canny', 'turbo_residual_unet')
            missing = [name for name in required if not (self.directory / f'{name}.mlpackage').exists()]
            if image is None:
                raise ValueError('Composite mode needs a drawing or image input.')
            if missing:
                raise ValueError(f'Composite mode is unavailable at {self.size}px; missing {", ".join(missing)}.')
            started = perf_counter()
            sketch, sketch_metrics = self.generate(
                prompt, image, mode='sketch', seed=seed, control_scale=control_scale,
                noise_phase=noise_phase, prompt_b=prompt_b, prompt_mix=prompt_mix, style=style)
            canny, canny_metrics = self.generate(
                prompt, control_image if control_image is not None else image, mode='canny', seed=seed,
                control_scale=control_scale if canny_control_scale is None else canny_control_scale,
                noise_phase=noise_phase, prompt_b=prompt_b, prompt_mix=prompt_mix, style='base')
            result = composite_layers(sketch, canny, mode=composite_mode, mix=composite_mix)
            return result, {
                'inference_ms': round((perf_counter() - started) * 1000, 2),
                'prompt_ms': round(sketch_metrics['prompt_ms'] + canny_metrics['prompt_ms'], 2),
                'encode_ms': 0,
                'unet_ms': round(sketch_metrics['unet_ms'] + canny_metrics['unet_ms'], 2),
                'decode_ms': round(sketch_metrics['decode_ms'] + canny_metrics['decode_ms'], 2),
                'control_ms': round(sketch_metrics['control_ms'] + canny_metrics['control_ms'], 2),
                'model': 'SDXS DreamShaper + SD-Turbo Canny',
                'style': style, 'mode': mode, 'size': self.size, 'seed': seed, 'timestep': 999,
                'composite_mode': composite_mode, 'composite_mix': float(composite_mix),
                'branches': {'sdxs': sketch_metrics, 'canny': canny_metrics},
            }
        start = perf_counter()
        turbo = mode in ('image','canny','depth','pose')
        embeds = self.encode_prompt(prompt, turbo=turbo)
        if prompt_b and prompt_mix > 0:
            embeds = (embeds.astype(np.float32)*(1-prompt_mix) + self.encode_prompt(prompt_b, turbo=turbo)*prompt_mix).astype(np.float16)
        prompt_ms = (perf_counter()-start)*1000
        noise = self.noise(seed)
        if noise_phase:
            # Continuous, variance-preserving orbit through two fixed latent noises.
            noise = np.cos(noise_phase)*noise + np.sin(noise_phase)*self.noise((seed+1)%2**32)
        if mode not in ('text','image','sketch','canny','depth','pose'): raise ValueError('Unknown mode')
        rgb = None
        if mode != 'text':
            if image is None: raise ValueError(f'{mode} mode requires an image')
            rgb = np.asarray(ImageOps.fit(image.convert('RGB'), (self.size,self.size)), dtype=np.float32)/255
        if mode == 'sketch' and 'controlled_unet' not in self.models:
            raise ValueError('Sketch ControlNet is not installed. Run ./scripts/download_models.sh first.')
        t = 999 if mode != 'image' else int(np.clip(strength, .05, 1.)*999)
        a = float(np.sqrt(self.alphas[t])); b = float(np.sqrt(1-self.alphas[t]))
        encode_ms = 0.
        if mode == 'image':
            tick = perf_counter()
            clean = self.models['encoder'].predict({'image': (rgb.transpose(2,0,1)[None]*2-1).astype(np.float16)})['latent'].astype(np.float32)
            encode_ms = (perf_counter()-tick)*1000
            key=(mode,seed,prompt,prompt_b)
            if self.previous is not None and self.previous_key == key and feedback:
                clean=clean*(1-feedback)+self.previous*feedback
            sample=a*clean+b*noise
        else:
            sample=b*noise
        inputs={'sample':sample.astype(np.float16),'timestep':np.array([t],dtype=np.float16),'encoder_hidden_states':embeds}
        denoiser=self.model('turbo_unet' if turbo else 'anime_unet' if style=='anime' else 'unet')
        if mode == 'sketch':
            denoiser=self.model('anime_controlled_unet' if style=='anime' else 'controlled_unet')
            inputs.update(control_image=rgb.transpose(2,0,1)[None].astype(np.float16), control_scale=np.array([control_scale],dtype=np.float16))
        tick=perf_counter()
        control_ms=0.
        if mode in ('canny','depth','pose'):
            control_inputs={**inputs,'control_image':rgb.transpose(2,0,1)[None].astype(np.float16),
                'control_scale':np.array([control_scale],dtype=np.float16)}
            residuals=self.model('control_'+mode).predict(control_inputs)
            control_ms=(perf_counter()-tick)*1000
            inputs.update(residuals)
            denoiser=self.model('turbo_residual_unet')
        pred=denoiser.predict(inputs)['noise_pred'].astype(np.float32)
        unet_ms=(perf_counter()-tick)*1000
        latent=(sample-b*pred)/a
        if not np.isfinite(latent).all(): raise RuntimeError('Non-finite latent from model')
        self.previous=latent.copy() if mode=='image' else None
        self.previous_key=(mode,seed,prompt,prompt_b)
        tick=perf_counter()
        decoded=self.models['decoder'].predict({'latent':latent.astype(np.float16)})['image']
        decode_ms=(perf_counter()-tick)*1000
        pixels=((decoded[0].transpose(1,2,0).astype(np.float32)+1)*127.5).clip(0,255).astype(np.uint8)
        result=Image.fromarray(pixels)
        return result, {'inference_ms':round((perf_counter()-start)*1000,2), 'prompt_ms':round(prompt_ms,2),
            'encode_ms':round(encode_ms,2),'unet_ms':round(unet_ms,2),'decode_ms':round(decode_ms,2),
            'control_ms':round(control_ms,2),'model':'SD-Turbo' if turbo else 'SDXS DreamShaper',
            'style':style if not turbo else 'base','mode':mode,'size':self.size,'seed':seed,'timestep':t}
