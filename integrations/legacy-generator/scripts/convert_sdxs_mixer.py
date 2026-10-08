"""Export the released SDXS sketch controller separately for residual mixing.
No Canny/depth/pose-trained weights are implied: all guides reuse sketch weights.
"""
import argparse, gc, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from convert import ROOT, CONTROL, MODEL, convert
from convert_controls import Control, ResidualUNet
import torch, numpy as np, coremltools as ct
from diffusers import ControlNetModel, UNet2DConditionModel
from huggingface_hub import snapshot_download
from peft import LoraConfig, get_peft_model, set_peft_model_state_dict

def main():
    p=argparse.ArgumentParser();p.add_argument('--size',type=int,choices=[256,384,512],default=256);p.add_argument('--with-anime',action='store_true');a=p.parse_args()
    d=ROOT/'models'/str(a.size);d.mkdir(parents=True,exist_ok=True)
    latent=torch.randn(1,4,a.size//8,a.size//8);t=torch.tensor([999.]);text=torch.randn(1,77,768)
    example=(latent,t,text,torch.rand(1,3,a.size,a.size),torch.tensor([1.]))
    path=snapshot_download(CONTROL,revision='cd341678087336ed72c05660ac84d765896b48e7',local_files_only=True)
    model=ControlNetModel.from_config(ControlNetModel.load_config(path))
    model.load_state_dict(torch.load(Path(path)/'diffusion_pytorch_model.bin',map_location='cpu',weights_only=True))
    wrapper=Control(model).eval()
    with torch.inference_mode():residuals=wrapper(*example)
    dest=d/'sdxs_sketch_control.mlpackage'
    if not dest.exists():
        with torch.inference_mode():traced=torch.jit.trace(wrapper,example,check_trace=False)
        names=['sample','timestep','encoder_hidden_states','control_image','control_scale']
        converted=ct.convert(traced,inputs=[ct.TensorType(name=n,shape=x.shape,dtype=np.float16) for n,x in zip(names,example)],
            outputs=[ct.TensorType(name=f'residual_{i}',dtype=np.float16) for i in range(len(residuals))],
            compute_units=ct.ComputeUnit.CPU_AND_GPU,minimum_deployment_target=ct.target.macOS14,convert_to='mlprogram')
        converted.save(str(dest));print('SAVED',dest,flush=True);del traced,converted
    del model,wrapper;gc.collect()
    base=snapshot_download(MODEL,revision='76f720262bb051da75666b22c902a78c8e16c763',local_files_only=True)
    unet=UNet2DConditionModel.from_pretrained(base,subfolder='unet')
    names=['sample','timestep','encoder_hidden_states']+[f'residual_{i}' for i in range(len(residuals))]
    convert('sdxs_residual_unet',ResidualUNet(unet),names,(latent,t,text)+residuals,'noise_pred',d)
    if not a.with_anime:return
    adapter=snapshot_download('IDKiro/SDXS-512-DreamShaper-Anime',revision='2faf8a65496cf66f3927ec48ae0f2ba7dd943e39',allow_patterns=['adapter_config.json','adapter_model.bin','README.md'])
    unet=get_peft_model(unet,LoraConfig.from_pretrained(adapter))
    result=set_peft_model_state_dict(unet,torch.load(Path(adapter)/'adapter_model.bin',map_location='cpu',weights_only=True))
    if result.unexpected_keys:raise RuntimeError('Adapter key mismatch')
    unet=unet.merge_and_unload().eval()
    convert('anime_sdxs_residual_unet',ResidualUNet(unet),names,(latent,t,text)+residuals,'noise_pred',d)
if __name__=='__main__':main()
