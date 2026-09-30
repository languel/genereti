"""ComfyUI nodes connecting to the running Genereti Core ML server on this Mac."""
import base64, io, json, urllib.request, urllib.error
import numpy as np
import torch
from PIL import Image

BASE='http://127.0.0.1:8765'

def _image_tensor(data):
    image=Image.open(io.BytesIO(data)).convert('RGB')
    return torch.from_numpy(np.asarray(image,dtype=np.float32).copy()/255)[None]

class GeneretiGenerate:
    @classmethod
    def INPUT_TYPES(cls):
        return {'required':{
            'prompt':('STRING',{'multiline':True,'default':'A luminous abstract performance stage made from hand-cut paper shapes, cobalt blue and orange light, energetic theatrical composition'}),
            'mode':(['text','image','sketch','canny','depth','pose'],),
            'style':(['base','anime'],),
            'preprocess':('BOOLEAN',{'default':True}),
            'seed':('INT',{'default':42,'min':0,'max':4294967295}),
            'strength':('FLOAT',{'default':.65,'min':.05,'max':1.,'step':.01}),
            'control_scale':('FLOAT',{'default':.8,'min':0.,'max':1.5,'step':.01}),
        },'optional':{'image':('IMAGE',)}}
    RETURN_TYPES=('IMAGE',)
    FUNCTION='generate'
    CATEGORY='Genereti / Local Core ML'
    DESCRIPTION='Generate via the local Genereti server. Pause other Genereti producers first. One image, one step.'
    def generate(self,prompt,mode,seed,strength,control_scale,image=None,style='base',preprocess=True):
        data=dict(prompt=prompt,mode=mode,seed=seed,strength=strength,control_scale=control_scale,style=style,preprocess=preprocess)
        if image is not None:
            pixels=(image[0].detach().cpu().numpy().clip(0,1)*255).astype(np.uint8)
            buf=io.BytesIO();Image.fromarray(pixels).save(buf,'PNG')
            data['image']=base64.b64encode(buf.getvalue()).decode()
        request=urllib.request.Request(BASE+'/api/generate',data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})
        try:
            with urllib.request.urlopen(request,timeout=60) as response:return (_image_tensor(response.read()),)
        except urllib.error.HTTPError as exc:raise RuntimeError(f'Genereti: {exc.read().decode()}') from exc
        except urllib.error.URLError as exc:raise RuntimeError('Start Genereti with Start-Genereti.command first.') from exc

class GeneretiLiveFrame:
    @classmethod
    def INPUT_TYPES(cls):return {'required':{}}
    RETURN_TYPES=('IMAGE',)
    FUNCTION='capture'
    CATEGORY='Genereti / Local Core ML'
    DESCRIPTION='Read the latest Genereti output, without running another generation. Queue again to refresh.'
    @classmethod
    def IS_CHANGED(cls,**kwargs):return float('nan')
    def capture(self):
        try:
            with urllib.request.urlopen(BASE+'/api/frame.jpg',timeout=10) as response:return (_image_tensor(response.read()),)
        except urllib.error.URLError as exc:raise RuntimeError('Start Genereti and generate at least one frame.') from exc

NODE_CLASS_MAPPINGS={'GeneretiGenerate':GeneretiGenerate,'GeneretiLiveFrame':GeneretiLiveFrame}
NODE_DISPLAY_NAME_MAPPINGS={'GeneretiGenerate':'Genereti Generate (Core ML)','GeneretiLiveFrame':'Genereti Live Frame'}
