import os, time, json
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
from huggingface_hub import snapshot_download
from pathlib import Path
import torch
import numpy as np
from diffusers import StableDiffusionPipeline
ROOT = Path(__file__).resolve().parents[1]
repo = 'IDKiro/sdxs-512-dreamshaper'
path = snapshot_download(repo, allow_patterns=['model_index.json','unet/*','text_encoder/*','tokenizer/*','vae/*','scheduler/*','README.md','LICENSE*'], ignore_patterns=['*.bin','*.onnx','*.msgpack'])
print('MODEL', path, flush=True)
pipe = StableDiffusionPipeline.from_pretrained(path, torch_dtype=torch.float16, safety_checker=None, feature_extractor=None).to('mps')
pipe.set_progress_bar_config(disable=True)
print('SCHEDULER',dict(pipe.scheduler.config),flush=True)
print('VAE', dict(pipe.vae.config),flush=True)
prompt = 'a luminous jellyfish floating in a deep blue ocean, bioluminescent, ethereal underwater photograph'
times=[]
for i in range(10):
 t=time.perf_counter()
 image=pipe(prompt,num_inference_steps=1,guidance_scale=0,generator=torch.Generator('cpu').manual_seed(42)).images[0]
 torch.mps.synchronize()
 elapsed=time.perf_counter()-t
 times.append(elapsed)
 print('FRAME',i,round(elapsed*1000,1),'ms',flush=True)
image.save(ROOT/'artifacts'/'mps-first-light.png')
report={'model':repo,'backend':'PyTorch MPS','size':512,'seconds':times,'warm_fps':1/np.median(times[3:]),'hardware':'M5 Max 40 GPU cores 128 GB'}
(ROOT/'artifacts'/'mps-benchmark.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report),flush=True)
