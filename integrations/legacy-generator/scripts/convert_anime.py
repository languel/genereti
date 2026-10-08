"""Merge the official SDXS anime LoRA, then export at unchanged one-step cost."""
import argparse,sys,gc,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from convert import ROOT, convert, Denoiser, ControlledDenoiser
from diffusers import UNet2DConditionModel,ControlNetModel
from huggingface_hub import snapshot_download
from peft import LoraConfig,get_peft_model,set_peft_model_state_dict
import torch
p=argparse.ArgumentParser();p.add_argument('--size',type=int,default=256,choices=[256,384,512]);a=p.parse_args()
base=snapshot_download('IDKiro/sdxs-512-dreamshaper',revision='76f720262bb051da75666b22c902a78c8e16c763',local_files_only=True)
adapter=snapshot_download('IDKiro/SDXS-512-DreamShaper-Anime',revision='2faf8a65496cf66f3927ec48ae0f2ba7dd943e39',allow_patterns=['adapter_config.json','adapter_model.bin','README.md'])
unet=UNet2DConditionModel.from_pretrained(base,subfolder='unet')
config=LoraConfig.from_pretrained(adapter)
unet=get_peft_model(unet,config)
result=set_peft_model_state_dict(unet,torch.load(Path(adapter)/'adapter_model.bin',map_location='cpu',weights_only=True))
print('Unexpected adapter keys',result.unexpected_keys,flush=True)
if result.unexpected_keys:raise RuntimeError('Adapter key mismatch')
unet=unet.merge_and_unload().eval()
s=a.size;d=ROOT/'models'/str(s);inputs=(torch.randn(1,4,s//8,s//8),torch.tensor([999.]),torch.randn(1,77,768))
convert('anime_unet',Denoiser(unet),['sample','timestep','encoder_hidden_states'],inputs,'noise_pred',d)
controlpath=snapshot_download('IDKiro/sdxs-512-dreamshaper-sketch',revision='cd341678087336ed72c05660ac84d765896b48e7',local_files_only=True)
control=ControlNetModel.from_config(ControlNetModel.load_config(controlpath))
control.load_state_dict(torch.load(Path(controlpath)/'diffusion_pytorch_model.bin',map_location='cpu',weights_only=True))
convert('anime_controlled_unet',ControlledDenoiser(unet,control),['sample','timestep','encoder_hidden_states','control_image','control_scale'],inputs+(torch.rand(1,3,s,s),torch.tensor([.8])),'noise_pred',d)
(d/'anime-provenance.json').write_text(json.dumps({'adapter':'IDKiro/SDXS-512-DreamShaper-Anime','revision':'2faf8a65496cf66f3927ec48ae0f2ba7dd943e39','scale':1,'size':s},indent=2))
