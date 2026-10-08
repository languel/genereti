"""Convert SDXS DreamShaper to fixed-shape Core ML for low-latency local inference.

Conversion approach informed by ochyai/streamdiffusion-mac. Pipeline math and
conditioning follow the original IDKiro SDXS diffusers models.
"""
import argparse, gc, json, os, time
from pathlib import Path
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'
import numpy as np
import torch
import coremltools as ct
from diffusers import UNet2DConditionModel, AutoencoderTiny, ControlNetModel
from huggingface_hub import snapshot_download

ROOT = Path(__file__).resolve().parents[1]
MODEL = 'IDKiro/sdxs-512-dreamshaper'
CONTROL = 'IDKiro/sdxs-512-dreamshaper-sketch'
torch.set_num_threads(6)

class Denoiser(torch.nn.Module):
    def __init__(self, unet):
        super().__init__(); self.unet = unet
    def forward(self, sample, timestep, encoder_hidden_states):
        return self.unet(sample, timestep, encoder_hidden_states, return_dict=False)[0]

class ControlledDenoiser(torch.nn.Module):
    def __init__(self, unet, control):
        super().__init__(); self.unet = unet; self.control = control
    def forward(self, sample, timestep, encoder_hidden_states, control_image, control_scale):
        down, mid = self.control(sample, timestep, encoder_hidden_states,
            controlnet_cond=control_image, conditioning_scale=1.0, return_dict=False)
        down = tuple(v * control_scale for v in down)
        mid = mid * control_scale
        return self.unet(sample, timestep, encoder_hidden_states,
            down_block_additional_residuals=down, mid_block_additional_residual=mid,
            return_dict=False)[0]

class Encoder(torch.nn.Module):
    def __init__(self, vae): super().__init__(); self.vae = vae
    def forward(self, image): return self.vae.encode(image, return_dict=False)[0]

class Decoder(torch.nn.Module):
    def __init__(self, vae): super().__init__(); self.vae = vae
    def forward(self, latent): return self.vae.decode(latent, return_dict=False)[0]

def convert(name, module, names, inputs, output, directory):
    dest = directory / (name + '.mlpackage')
    if dest.exists():
        print('EXISTS', dest, flush=True); return
    start = time.perf_counter()
    module = module.eval().float().cpu()
    with torch.inference_mode():
        traced = torch.jit.trace(module, inputs, check_trace=False)
    print('TRACED', name, round(time.perf_counter()-start,1), flush=True)
    model = ct.convert(traced,
        inputs=[ct.TensorType(name=n, shape=x.shape, dtype=np.float16) for n,x in zip(names,inputs)],
        outputs=[ct.TensorType(name=output, dtype=np.float16)],
        compute_units=ct.ComputeUnit.CPU_AND_GPU,
        minimum_deployment_target=ct.target.macOS14, convert_to='mlprogram')
    model.save(str(dest))
    print('SAVED', name, round(time.perf_counter()-start,1),'seconds', flush=True)
    del model, traced
    gc.collect()

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--control',action='store_true')
    parser.add_argument('--size',type=int,default=512,choices=[256,384,512])
    args=parser.parse_args()
    directory=ROOT/'models'/str(args.size)
    directory.mkdir(parents=True,exist_ok=True)
    size=args.size; latent=size//8
    inputs=(torch.randn(1,4,latent,latent),torch.tensor([999.]),torch.randn(1,77,768))
    path=snapshot_download(MODEL,revision='76f720262bb051da75666b22c902a78c8e16c763',allow_patterns=['unet/*','text_encoder/*','tokenizer/*','vae/*','scheduler/*','model_index.json','README.md','LICENSE*'],ignore_patterns=['*.bin','*.onnx','*.msgpack'])
    print('Loading',path,flush=True)
    if args.control:
        unet=UNet2DConditionModel.from_pretrained(path,subfolder='unet')
        control_path=snapshot_download(CONTROL,revision='cd341678087336ed72c05660ac84d765896b48e7', allow_patterns=['config.json','diffusion_pytorch_model.bin','README.md','LICENSE*'])
        control=ControlNetModel.from_config(ControlNetModel.load_config(control_path))
        control.load_state_dict(torch.load(Path(control_path)/'diffusion_pytorch_model.bin', map_location='cpu', weights_only=True))
        convert('controlled_unet',ControlledDenoiser(unet,control),
            ['sample','timestep','encoder_hidden_states','control_image','control_scale'],
            inputs+(torch.rand(1,3,size,size),torch.tensor([0.8])), 'noise_pred',directory)
    else:
        unet=UNet2DConditionModel.from_pretrained(path,subfolder='unet')
        convert('unet',Denoiser(unet),['sample','timestep','encoder_hidden_states'],inputs,'noise_pred',directory)
        del unet; gc.collect()
        vae=AutoencoderTiny.from_pretrained(path,subfolder='vae')
        convert('encoder',Encoder(vae),['image'],(torch.rand(1,3,size,size)*2-1,),'latent',directory)
        convert('decoder',Decoder(vae),['latent'],(torch.randn(1,4,latent,latent),),'image',directory)
    (directory/'provenance.json').write_text(json.dumps({'base':MODEL,'base_revision':Path(path).name,'size':size,'coremltools':ct.__version__,'torch':torch.__version__},indent=2))

if __name__=='__main__': main()
