"""ComfyUI nodes connecting to the running Genereti Core ML server on this Mac."""
import base64, io, json, time, urllib.request, urllib.error
import numpy as np
import torch
from PIL import Image

BASE='http://127.0.0.1:8765'

def _image_tensor(data):
    image=Image.open(io.BytesIO(data)).convert('RGB')
    return torch.from_numpy(np.asarray(image,dtype=np.float32).copy()/255)[None]

def _configure_resolution(mode, style, resolution):
    """Resolve model size independently of the last browser producer's setting."""
    try:
        with urllib.request.urlopen(BASE+'/api/status',timeout=10) as response:
            state=json.loads(response.read())
        if state.get('resolution_handler'):return True
        current=int(state['size'])
        catalog=state.get('models_by_size',{})
        turbo=mode in ('image','canny','depth','pose')
        required={'encoder','decoder','turbo_unet' if turbo else 'anime_unet' if style=='anime' else 'unet'}
        if mode=='sketch':required.add('anime_controlled_unet' if style=='anime' else 'controlled_unet')
        if mode in ('canny','depth','pose'):required.update(('control_'+mode,'turbo_residual_unet'))
        if resolution=='auto':
            if catalog:
                supported=[int(size) for size,models in catalog.items() if required.issubset(models)]
                if not supported:raise RuntimeError(f'No installed model size supports {mode} ({style}).')
                size=current if current in supported else min(supported)
            else:
                # Older servers only report the active size. The shipped Turbo packages are 256px.
                size=256 if turbo else current
        else:size=int(resolution)
        models=catalog.get(str(size),state.get('available_models',[]) if size==current else None)
        if models is not None:
            missing=required-set(models)
            if missing:raise RuntimeError(f'{mode} is unavailable at {size}px (missing {", ".join(sorted(missing))}). Choose auto resolution or install the matching models.')
        if size!=current:
            request=urllib.request.Request(BASE+'/api/config/size',data=json.dumps({'size':size}).encode(),headers={'Content-Type':'application/json'})
            with urllib.request.urlopen(request,timeout=120) as response:response.read()
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'Could not select Genereti model resolution: {exc.read().decode(errors="replace")}') from exc
    except urllib.error.URLError as exc:
        raise RuntimeError('Start Genereti with Start-Genereti.command first.') from exc

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
        },'optional':{'image':('IMAGE',), 'resolution':(['auto','256','512'],{'default':'auto'})}}
    RETURN_TYPES=('IMAGE',)
    FUNCTION='generate'
    CATEGORY='Genereti / Local Core ML'
    DESCRIPTION='Generate via the local Genereti server. Pause other Genereti producers first. Auto resolution selects an installed size for this mode. Resolution is shared with other producers. Pose needs a prepared pose guide. One image, one step.'
    def generate(self,prompt,mode,seed,strength,control_scale,image=None,style='base',preprocess=True,resolution='auto'):
        server_resolves=_configure_resolution(mode,style,resolution)
        data=dict(prompt=prompt,mode=mode,seed=seed,strength=strength,control_scale=control_scale,style=style,preprocess=preprocess)
        if server_resolves:data['resolution']='auto' if resolution=='auto' else int(resolution)
        if image is not None:
            pixels=(image[0].detach().cpu().numpy().clip(0,1)*255).astype(np.uint8)
            buf=io.BytesIO();Image.fromarray(pixels).save(buf,'PNG')
            data['image']=base64.b64encode(buf.getvalue()).decode()
        request=urllib.request.Request(BASE+'/api/generate',data=json.dumps(data).encode(),headers={'Content-Type':'application/json'})
        for attempt in range(4):
            try:
                with urllib.request.urlopen(request,timeout=60) as response:return (_image_tensor(response.read()),)
            except urllib.error.HTTPError as exc:
                body=exc.read().decode(errors='replace')
                if exc.code==429:
                    if attempt<3:
                        time.sleep(.15 * 2**attempt)
                        continue
                    raise RuntimeError('Genereti is busy. Pause Start live in the p5 lab or Excalidraw app, then run Comfy again. To view live output without generating, use Genereti Live Frame or Genereti Receive Frame.') from exc
                try:detail=json.loads(body).get('detail',body)
                except (ValueError,AttributeError):detail=body
                raise RuntimeError(f'Genereti HTTP {exc.code}: {detail}') from exc
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

WEB_DIRECTORY="./web"
