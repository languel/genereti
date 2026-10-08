"""Optional SD-Turbo model for img2img at variable noise levels."""
import argparse, sys, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from convert import convert, Denoiser, ROOT
from diffusers import UNet2DConditionModel
from huggingface_hub import snapshot_download
import torch
p=argparse.ArgumentParser();p.add_argument('--size',type=int,default=256,choices=[256,384,512]);a=p.parse_args()
model='stabilityai/sd-turbo';revision='b261bac6fd2cf515557d5d0707481eafa0485ec2'
path=snapshot_download(model,revision=revision,allow_patterns=['unet/config.json','unet/*.fp16.safetensors','text_encoder/config.json','text_encoder/*.fp16.safetensors','tokenizer/*','scheduler/*','README.md','LICENSE*'])
unet=UNet2DConditionModel.from_pretrained(path,subfolder='unet',variant='fp16')
size=a.size;directory=ROOT/'models'/str(size)
convert('turbo_unet',Denoiser(unet),['sample','timestep','encoder_hidden_states'],
    (torch.randn(1,4,size//8,size//8),torch.tensor([499.]),torch.randn(1,77,1024)), 'noise_pred',directory)
(directory/'turbo-provenance.json').write_text(json.dumps({'base':model,'revision':revision,'size':size},indent=2))
