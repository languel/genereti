"""Convert SD2.1 ControlNets and a shared SD-Turbo UNet with residual inputs.
These are experimental one-step uses of controls trained for multi-step SD2.1.
"""
import sys, argparse, gc, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from convert import ROOT, convert
import torch
import numpy as np
import coremltools as ct
from diffusers import ControlNetModel, UNet2DConditionModel
from huggingface_hub import snapshot_download
REPOS={
 'canny':('thibaud/controlnet-sd21-canny-diffusers','9c3106f9154d708550f2c83d231fbd648da7b670'),
 'depth':('thibaud/controlnet-sd21-depth-diffusers','938454a38a0e4e321c09326facaa8074ec94d9e0'),
 'pose':('thibaud/controlnet-sd21-openposev2-diffusers','60bbf5f77aa4d6059f7ba6cc235b512124d18364'),
}
class Control(torch.nn.Module):
 def __init__(self,model):super().__init__();self.model=model
 def forward(self,sample,timestep,encoder_hidden_states,control_image,control_scale):
  down,mid=self.model(sample,timestep,encoder_hidden_states,controlnet_cond=control_image,conditioning_scale=1.,return_dict=False)
  return tuple(x*control_scale for x in down)+(mid*control_scale,)
class ResidualUNet(torch.nn.Module):
 def __init__(self,model):super().__init__();self.model=model
 def forward(self,sample,timestep,encoder_hidden_states,*residuals):
  return self.model(sample,timestep,encoder_hidden_states,down_block_additional_residuals=residuals[:-1],mid_block_additional_residual=residuals[-1],return_dict=False)[0]

def main():
 p=argparse.ArgumentParser();p.add_argument('--size',type=int,default=256,choices=[256,384,512]);p.add_argument('--guides',nargs='+',default=['canny','depth','pose'],choices=list(REPOS));a=p.parse_args()
 d=ROOT/'models'/str(a.size);d.mkdir(exist_ok=True,parents=True);s=a.size;l=s//8
 latent=torch.randn(1,4,l,l);t=torch.tensor([999.]);text=torch.randn(1,77,1024)
 example=(latent,t,text,torch.rand(1,3,s,s),torch.tensor([.8]))
 provenance={}
 for name in a.guides:
  dest=d/f'control_{name}.mlpackage';repo,rev=REPOS[name]
  path=snapshot_download(repo,revision=rev,allow_patterns=['config.json','diffusion_pytorch_model.bin','README.md'])
  provenance[name]={'repo':repo,'revision':rev}
  model=ControlNetModel.from_config(ControlNetModel.load_config(path))
  model.load_state_dict(torch.load(Path(path)/'diffusion_pytorch_model.bin',map_location='cpu',weights_only=True));model.eval()
  wrapper=Control(model).eval()
  with torch.inference_mode():residuals=wrapper(*example)
  if not dest.exists():
   with torch.inference_mode():traced=torch.jit.trace(wrapper,example,check_trace=False)
   names=['sample','timestep','encoder_hidden_states','control_image','control_scale']
   converted=ct.convert(traced,inputs=[ct.TensorType(name=n,shape=x.shape,dtype=np.float16) for n,x in zip(names,example)],
     outputs=[ct.TensorType(name=f'residual_{i}',dtype=np.float16) for i in range(len(residuals))],
     compute_units=ct.ComputeUnit.CPU_AND_GPU,minimum_deployment_target=ct.target.macOS14,convert_to='mlprogram')
   converted.save(str(dest));print('SAVED',dest,flush=True);del converted,traced
  else:print('EXISTS',dest,flush=True)
  if not (d/'turbo_residual_unet.mlpackage').exists():
   upath=snapshot_download('stabilityai/sd-turbo',revision='b261bac6fd2cf515557d5d0707481eafa0485ec2',local_files_only=True)
   unet=UNet2DConditionModel.from_pretrained(upath,subfolder='unet',variant='fp16')
   convert('turbo_residual_unet',ResidualUNet(unet),['sample','timestep','encoder_hidden_states']+[f'residual_{i}' for i in range(len(residuals))],
       (latent,t,text)+residuals,'noise_pred',d)
   del unet
  del model,wrapper,residuals;gc.collect()
 (d/'controls-provenance.json').write_text(json.dumps(provenance,indent=2))
if __name__=='__main__':main()
